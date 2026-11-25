import common from "./common";
import chrome from "./chrome";
import home from "./home";
import product from "./product";
import checkout from "./checkout";
import dealer from "./dealer";

// One file per area so screens can add strings without touching each other's files.
const ur: Record<string, string> = { ...common, ...chrome, ...home, ...product, ...checkout, ...dealer };

export default ur;
