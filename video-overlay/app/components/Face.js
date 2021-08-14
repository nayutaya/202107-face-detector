import BoundingBox from "../components/BoundingBox";
import ScoreBar from "../components/ScoreBar";
import KeyPoints from "../components/KeyPoints";
import Attributes from "../components/Attributes";

export default function Face({ face, shows }) {
  const [
    score,
    [ x1, y1, x2, y2 ],
    keyPoints,
    [ sex, age ],
  ] = face;
  const color = {M: "#6666CC", F: "#CC6666"}[sex];
  return (
    <g>
      {!shows.boundingBox ? null :
        <BoundingBox
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            color={color} />
      }
      {!shows.score ? null :
        <ScoreBar
            score={score}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            color={color} />
      }
      {!shows.keyPoints ? null :
        <KeyPoints
            points={keyPoints}
            color={"#009900"} />
      }
      {!shows.attributes ? null :
        <Attributes
            sex={sex}
            age={age}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            color={color} />
      }
    </g>
  );
}
