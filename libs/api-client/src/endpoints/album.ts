import type {
  AlbumPresign,
  ModerateAlbumPhoto,
  UpdateAlbum,
  UploadAlbumPhotos,
} from '@wishly/contracts';
import { http } from '../client';

export type PublicAlbum = {
  title: string;
  opensAt: string;
  closesAt: string;
  open: boolean;
  canUpload: boolean;
  photos: Array<{
    id: string;
    url: string;
    uploaderName: string;
    createdAt: string;
  }>;
};

export type OwnerAlbum = {
  id: string;
  title: string;
  opensAt: string;
  closesAt: string;
  open: boolean;
  pendingCount: number;
  photos: Array<{
    id: string;
    url: string;
    uploaderName: string;
    status: string;
    createdAt: string;
    byteSize: number | null;
  }>;
};

export const albumApi = {
  getPublic: (slug: string) => http<PublicAlbum>(`/public/album/${slug}`),

  presign: (slug: string, body: AlbumPresign) =>
    http<{ uploadUrl: string; key: string; publicUrl: string }>(
      `/public/album/${slug}/presign`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  uploadPhotos: (slug: string, body: UploadAlbumPhotos) =>
    http<{ accepted: number; message: string }>(
      `/public/album/${slug}/photos`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  zipUrl: (slug: string) =>
    `${import.meta.env.VITE_API_URL ?? '/api'}/public/album/${slug}/zip`,

  getOwner: (invitationId: string) =>
    http<OwnerAlbum>(`/invitations/${invitationId}/album`),

  update: (invitationId: string, body: UpdateAlbum) =>
    http(`/invitations/${invitationId}/album`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  moderate: (
    invitationId: string,
    photoId: string,
    body: ModerateAlbumPhoto
  ) =>
    http(`/invitations/${invitationId}/album/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  approveAll: (invitationId: string) =>
    http<{ approved: number }>(
      `/invitations/${invitationId}/album/approve-all`,
      { method: 'POST', body: '{}' }
    ),
};
