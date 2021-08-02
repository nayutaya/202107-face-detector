export default function CroppedFaceImage({ imageWidth, imageHeight, dataUrl, face, faceWidth, faceHeight }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`${x1} ${y1} ${x2 - x1} ${y2 - y1}`}
        width={faceWidth}
        height={faceHeight}>
      <image
          x={0}
          y={0}
          width={imageWidth}
          height={imageHeight}
          href={dataUrl} />
    </svg>
  );
}
