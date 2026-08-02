import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type {
  AlbumPresign,
  ModerateAlbumPhoto,
  UpdateAlbum,
  UploadAlbumPhotos,
} from '@wishly/contracts';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import type { AuthUser } from '../auth/auth.types';
import { InvitationsService } from '../invitations/invitations.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';

const QUOTA_PER_SESSION = 10;

@Injectable()
export class AlbumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService,
    private readonly media: MediaService
  ) {}

  async getPublic(slug: string) {
    const album = await this.findAlbumBySlug(slug);
    const now = new Date();
    const open = now >= album.opensAt && now < album.closesAt;
    const photos = await this.prisma.albumPhoto.findMany({
      where: { albumId: album.id, status: 'ok' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mediaKey: true,
        uploaderName: true,
        createdAt: true,
      },
    });
    return {
      title: album.title,
      opensAt: album.opensAt,
      closesAt: album.closesAt,
      open,
      canUpload: open,
      photos: photos.map((p) => ({
        id: p.id,
        url: this.media.resolvePublicUrl(p.mediaKey),
        uploaderName: p.uploaderName,
        createdAt: p.createdAt,
      })),
    };
  }

  async presign(slug: string, input: AlbumPresign, anonSessionId: string) {
    if (!anonSessionId) {
      throw new BadRequestException('Thiếu phiên — tải lại trang rồi thử lại.');
    }
    const album = await this.findAlbumBySlug(slug);
    this.assertOpen(album);
    await this.assertQuota(album.id, anonSessionId);
    return this.media.createAlbumPresign(album.invitationId, input);
  }

  async uploadPhotos(
    slug: string,
    input: UploadAlbumPhotos,
    anonSessionId: string
  ) {
    if (!anonSessionId) {
      throw new BadRequestException('Thiếu phiên — tải lại trang rồi thử lại.');
    }
    const album = await this.findAlbumBySlug(slug);
    this.assertOpen(album);
    const prefix = `album/${album.invitationId}/`;
    for (const key of input.mediaKeys) {
      if (!key.startsWith(prefix)) {
        throw new BadRequestException('mediaKey không thuộc album này.');
      }
    }
    const existing = await this.countSessionUploads(album.id, anonSessionId);
    if (existing + input.mediaKeys.length > QUOTA_PER_SESSION) {
      throw new BadRequestException(
        `Mỗi phiên chỉ tải tối đa ${QUOTA_PER_SESSION} ảnh.`
      );
    }

    let guestId: string | null = null;
    if (input.guestToken) {
      const guest = await this.prisma.guest.findUnique({
        where: { token: input.guestToken },
      });
      if (guest?.invitationId === album.invitationId) guestId = guest.id;
    }

    const name = input.uploaderName.trim().slice(0, 80);
    await this.prisma.$transaction(
      input.mediaKeys.map((mediaKey) =>
        this.prisma.albumPhoto.create({
          data: {
            albumId: album.id,
            mediaKey,
            uploaderName: name,
            guestId,
            status: 'pending',
          },
        })
      )
    );
    await this.bumpQuota(album.id, anonSessionId, input.mediaKeys.length);

    return {
      accepted: input.mediaKeys.length,
      message: 'Ảnh của bạn sẽ hiện sau khi gia chủ duyệt.',
    };
  }

  async getOwnerAlbum(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId);
    const album = await this.prisma.album.findUnique({
      where: { invitationId },
      include: {
        photos: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!album) {
      throw new NotFoundException('Chưa có album — hãy xuất bản thiệp.');
    }
    const pending = album.photos.filter((p) => p.status === 'pending').length;
    return {
      id: album.id,
      title: album.title,
      opensAt: album.opensAt,
      closesAt: album.closesAt,
      open: new Date() < album.closesAt,
      pendingCount: pending,
      photos: album.photos.map((p) => ({
        id: p.id,
        url: this.media.resolvePublicUrl(p.mediaKey),
        uploaderName: p.uploaderName,
        status: p.status,
        createdAt: p.createdAt,
        byteSize: p.byteSize,
      })),
    };
  }

  async moderate(
    invitationId: string,
    photoId: string,
    input: ModerateAlbumPhoto,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const photo = await this.prisma.albumPhoto.findFirst({
      where: { id: photoId, album: { invitationId } },
    });
    if (!photo) throw new NotFoundException('Không tìm thấy ảnh.');
    // Intentionally no notification when hiding — product constraint.
    return this.prisma.albumPhoto.update({
      where: { id: photoId },
      data: { status: input.status },
      select: { id: true, status: true },
    });
  }

  async approveAll(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const album = await this.prisma.album.findUnique({
      where: { invitationId },
    });
    if (!album) throw new NotFoundException('Chưa có album.');
    const res = await this.prisma.albumPhoto.updateMany({
      where: { albumId: album.id, status: 'pending' },
      data: { status: 'ok' },
    });
    return { approved: res.count };
  }

  async updateAlbum(
    invitationId: string,
    input: UpdateAlbum,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const data: { title?: string; closesAt?: Date } = {};
    if (input.title) data.title = input.title.trim();
    if (input.closesAt) data.closesAt = new Date(input.closesAt);
    return this.prisma.album.update({
      where: { invitationId },
      data,
      select: {
        id: true,
        title: true,
        opensAt: true,
        closesAt: true,
      },
    });
  }

  async zipPublic(slug: string): Promise<{
    file: StreamableFile;
    filename: string;
    estimatedBytes: number;
  }> {
    const album = await this.findAlbumBySlug(slug);
    const photos = await this.prisma.albumPhoto.findMany({
      where: { albumId: album.id, status: 'ok' },
      orderBy: { createdAt: 'asc' },
    });
    const estimatedBytes = photos.reduce((s, p) => s + (p.byteSize ?? 0), 0);
    const pass = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err) => pass.destroy(err));
    archive.pipe(pass);

    void (async () => {
      let i = 0;
      for (const p of photos) {
        i += 1;
        try {
          const stream = await this.media.getObjectStream(p.mediaKey);
          const ext = p.mediaKey.split('.').pop() || 'jpg';
          const safe = p.uploaderName.replace(/[^\w\u00C0-\u024F -]/g, '').slice(0, 20);
          archive.append(stream, {
            name: `${String(i).padStart(3, '0')}-${safe || 'anh'}.${ext}`,
          });
        } catch {
          /* skip missing objects */
        }
      }
      await archive.finalize();
    })();

    return {
      file: new StreamableFile(pass),
      filename: `album-${slug}.zip`,
      estimatedBytes,
    };
  }

  private async findAlbumBySlug(slug: string) {
    const inv = await this.prisma.invitation.findFirst({
      where: {
        slug,
        status: { in: ['PUBLISHED', 'ENDED'] },
      },
      include: { album: true },
    });
    if (!inv?.album) throw new NotFoundException('Không tìm thấy album.');
    return { ...inv.album, invitationId: inv.id, slug: inv.slug };
  }

  private assertOpen(album: { opensAt: Date; closesAt: Date }) {
    const now = new Date();
    if (now < album.opensAt) {
      throw new ForbiddenException('Album chưa mở.');
    }
    if (now >= album.closesAt) {
      throw new ForbiddenException(
        'Album đã đóng — vẫn xem và tải được ảnh đã duyệt.'
      );
    }
  }

  private async assertQuota(albumId: string, sessionId: string) {
    const n = await this.countSessionUploads(albumId, sessionId);
    if (n >= QUOTA_PER_SESSION) {
      throw new BadRequestException(
        `Mỗi phiên chỉ tải tối đa ${QUOTA_PER_SESSION} ảnh.`
      );
    }
  }

  private async countSessionUploads(albumId: string, sessionId: string) {
    const row = await this.prisma.albumUploadQuota.findUnique({
      where: { albumId_sessionId: { albumId, sessionId } },
    });
    return row?.count ?? 0;
  }

  private async bumpQuota(albumId: string, sessionId: string, by: number) {
    await this.prisma.albumUploadQuota.upsert({
      where: { albumId_sessionId: { albumId, sessionId } },
      create: { albumId, sessionId, count: by },
      update: { count: { increment: by } },
    });
  }
}
