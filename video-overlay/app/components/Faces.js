import Face from "../components/Face";

export default function Faces({ faces, shows }) {
  if ( faces == null ) return null;
  return (
    <g>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face}
            shows={shows} />
      ))}
    </g>
  );
}
