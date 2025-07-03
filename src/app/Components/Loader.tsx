import Player from "lottie-react";
import loaderAnimation from "./loader.json";

const Loader = ({ height = 80 }) => (
  <div className="flex justify-center items-center py-6">
    <div className="max-w-[60px] w-full" style={{ height }}>
      <Player autoplay loop animationData={loaderAnimation} />
    </div>
  </div>
);

export default Loader;
