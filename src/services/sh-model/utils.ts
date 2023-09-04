import {
  ConnectedTerrain,
  ElementStack,
  Situation,
  Token,
} from "secrethistories-api";

// TODO: Move to api lib

export function isElementStack(x: Token): x is ElementStack {
  return x.payloadType === "ElementStack";
}

export function isSituation(x: Token): x is Situation {
  return x.payloadType === "Situation";
}

export function isConnectedTerrain(x: Token): x is ConnectedTerrain {
  return x.payloadType === "ConnectedTerrain";
}

export function extractLibraryRoomTokenIdFromPath(path: string): string | null {
  if (!path.startsWith("~/library")) {
    return null;
  }

  const innerSpherePath = path.substring("~/library".length);
  if (!innerSpherePath.startsWith("!") && !innerSpherePath.startsWith("/!")) {
    return null;
  }

  let endIndex = innerSpherePath.indexOf("/", 1);
  if (endIndex === -1) {
    endIndex = innerSpherePath.length - 1;
  }

  const token = innerSpherePath.substring(0, endIndex);
  return token;
}
