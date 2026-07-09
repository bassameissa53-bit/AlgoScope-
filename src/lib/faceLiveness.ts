import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/face-landmarks-detection";

let detector: any = null;
let loadPromise: Promise<any> | null = null;

export async function loadFaceMesh() {
  if (detector) return detector;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await tf.setBackend("webgl");
    await tf.ready();
    // NOTE: runtime "tfjs" (not "mediapipe") is intentional — the mediapipe
    // runtime fetches WASM binaries from a third-party CDN at runtime, which
    // is fragile on inconsistent connections and can hang silently with no
    // error surfaced to the UI. "tfjs" runs entirely on the already-loaded
    // TensorFlow.js backend, so there's nothing extra to fetch beyond the
    // model weights (and those are cached by the browser after first load).
    detector = await facemesh.createDetector(
      facemesh.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 1,
      },
    );
    return detector;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null; // allow retry on next call
    throw err;
  }
}

const LEFT_EYE = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];

function eyeAspectRatio(landmarks: any[], indices: number[]) {
  const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
  const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
  const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
  const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y);
  return (vertical1 + vertical2) / (2 * horizontal);
}

function mouthAspectRatio(landmarks: any[]) {
  const topLip = landmarks[13];
  const bottomLip = landmarks[14];
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];
  const height = Math.hypot(topLip.x - bottomLip.x, topLip.y - bottomLip.y);
  const width = Math.hypot(leftCorner.x - rightCorner.x, leftCorner.y - rightCorner.y);
  return height / width;
}

export interface FrameAnalysisResult {
  faceDetected: boolean;
  eyesClosed?: boolean;
  isSmiling?: boolean;
  faceSize?: number;
  faceCentered?: boolean;
  ear?: number;
  mar?: number;
}

export async function analyzeVideoFrame(videoElement: HTMLVideoElement): Promise<FrameAnalysisResult> {
  if (!detector) await loadFaceMesh();
  const faces = await detector.estimateFaces(videoElement);
  if (!faces.length) return { faceDetected: false };

  const lm = faces[0].keypoints;
  const leftEAR = eyeAspectRatio(lm, LEFT_EYE);
  const rightEAR = eyeAspectRatio(lm, RIGHT_EYE);
  const avgEAR = (leftEAR + rightEAR) / 2;
  const mar = mouthAspectRatio(lm);

  const box = faces[0].box;
  const xCenter = box.xMin + box.width / 2;
  const videoWidth = videoElement.videoWidth || 1;

  return {
    faceDetected: true,
    eyesClosed: avgEAR < 0.21,
    isSmiling: mar > 0.06,
    faceSize: box.width / videoWidth,
    faceCentered: Math.abs(xCenter / videoWidth - 0.5) < 0.12,
    ear: avgEAR,
    mar,
  };
}

export interface LivenessTrackingState {
  faceDetected: boolean;
  eyesClosed: boolean;
  isSmiling: boolean;
  centered: boolean;
  faceSize: number;
  blinkCount: number;
  smileDetected: boolean;
  ear: number;
  mar: number;
}

export interface LivenessCheckResult {
  blinkTimestamps: number[];
  smileDetected: boolean;
}

export interface LivenessCallbacks {
  onUpdate?: (state: LivenessTrackingState) => void;
  onComplete?: (result: LivenessCheckResult) => void;
  onError?: (error: Error) => void;
}

export function runLivenessCheck(
  videoElement: HTMLVideoElement,
  callbacks: LivenessCallbacks,
): () => void {
  let running = true;
  let lastEyesClosed = false;
  const blinkTimestamps: number[] = [];
  let smileFrames = 0;
  let smileDetected = false;

  const MIN_BLINKS = 2;
  const SMILE_FRAMES_REQUIRED = 5;
  const MAX_DURATION = 30_000;

  const startTime = performance.now();

  const loop = async () => {
    if (!running) return;

    try {
      const frame = await analyzeVideoFrame(videoElement);
      const now = performance.now();

      if (!frame.faceDetected || frame.eyesClosed === undefined || frame.isSmiling === undefined) {
        callbacks.onUpdate?.({
          faceDetected: false,
          eyesClosed: false,
          isSmiling: false,
          centered: false,
          faceSize: 0,
          blinkCount: blinkTimestamps.length,
          smileDetected,
          ear: 0,
          mar: 0,
        });

        if (running) requestAnimationFrame(loop);
        return;
      }

      // Blink detection: transition open -> closed
      if (!lastEyesClosed && frame.eyesClosed) {
        blinkTimestamps.push(now);
        if (blinkTimestamps.length > 4) blinkTimestamps.shift();
      }
      lastEyesClosed = frame.eyesClosed;

      // Stable smile detection (hold for ~5 frames at 30fps)
      if (frame.isSmiling) {
        smileFrames++;
        if (smileFrames >= SMILE_FRAMES_REQUIRED) {
          smileDetected = true;
        }
      } else {
        smileFrames = 0;
      }

      callbacks.onUpdate?.({
        faceDetected: true,
        eyesClosed: frame.eyesClosed,
        isSmiling: frame.isSmiling,
        centered: !!frame.faceCentered,
        faceSize: frame.faceSize ?? 0,
        blinkCount: blinkTimestamps.length,
        smileDetected,
        ear: frame.ear ?? 0,
        mar: frame.mar ?? 0,
      });

      if (blinkTimestamps.length >= MIN_BLINKS && smileDetected) {
        running = false;
        callbacks.onComplete?.({ blinkTimestamps, smileDetected });
        return;
      }

      if (now - startTime > MAX_DURATION) {
        running = false;
        callbacks.onError?.(
          new Error("Liveness check timed out. Please blink twice and smile clearly."),
        );
        return;
      }

      if (running) requestAnimationFrame(loop);
    } catch (error) {
      running = false;
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  requestAnimationFrame(loop);

  return () => {
    running = false;
  };
}
