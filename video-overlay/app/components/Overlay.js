import Faces from "../components/Faces";

export default function Overlay({ style, width, height, faces, shows }) {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`0 0 ${width} ${height}`}
        style={style}
        width={width}
        height={height}>
      {faces == null ? null : (
        <Faces
            faces={faces}
            shows={shows}/>
      )}
    </svg>
  );
}
