export type QrScanCallback = (text: string) => void;

export interface QrScanner {
  start(video: HTMLVideoElement, onScan: QrScanCallback): Promise<void>;
  stop(): void;
}

type BarcodeDetectorLike = {
  detect: (
    source: ImageBitmapSource
  ) => Promise<Array<{ rawValue: string }>>;
};

function hasBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

class NativeBarcodeScanner implements QrScanner {
  private timer: number | null = null;
  private stream: MediaStream | null = null;
  private detector: BarcodeDetectorLike | null = null;

  async start(video: HTMLVideoElement, onScan: QrScanCallback) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BD = (window as any).BarcodeDetector as new (opts: {
      formats: string[];
    }) => BarcodeDetectorLike;
    this.detector = new BD({ formats: ['qr_code'] });
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    video.srcObject = this.stream;
    await video.play();
    const tick = async () => {
      if (!this.detector || video.readyState < 2) {
        this.timer = window.setTimeout(tick, 200);
        return;
      }
      try {
        const codes = await this.detector.detect(video);
        if (codes[0]?.rawValue) onScan(codes[0].rawValue);
      } catch {
        /* ignore frame errors */
      }
      this.timer = window.setTimeout(tick, 250);
    };
    this.timer = window.setTimeout(tick, 300);
  }

  stop() {
    if (this.timer != null) window.clearTimeout(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

class ZxingScanner implements QrScanner {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private reader: any = null;
  private controls: { stop: () => void } | null = null;

  async start(video: HTMLVideoElement, onScan: QrScanCallback) {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    this.reader = new BrowserMultiFormatReader();
    this.controls = await this.reader.decodeFromVideoDevice(
      undefined,
      video,
      (result: { getText: () => string } | undefined, _err: unknown) => {
        if (result) onScan(result.getText());
      }
    );
  }

  stop() {
    try {
      this.controls?.stop();
    } catch {
      /* ignore */
    }
    this.controls = null;
    this.reader = null;
  }
}

export function createQrScanner(): QrScanner {
  if (hasBarcodeDetector()) return new NativeBarcodeScanner();
  return new ZxingScanner();
}
