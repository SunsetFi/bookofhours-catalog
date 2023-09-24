import {
  ConnectedTerrain,
  ElementStack,
  Situation,
  SphereSpec,
  Token,
} from "secrethistories-api";

import { ElementStackModel } from "./token-models/ElementStackModel";

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

export function sphereMatchesToken(
  t: SphereSpec,
  input: ElementStackModel
): unknown {
  for (const essential of Object.keys(t.essential)) {
    const expectedValue = t.essential[essential];
    const compareValue = input.elementAspects[essential];
    if (expectedValue < 0) {
      if (compareValue >= -expectedValue) {
        return false;
      }
    } else if (compareValue < expectedValue) {
      return false;
    }
  }

  let foundRequired = false;
  for (const required of Object.keys(t.required)) {
    foundRequired = true;
    const expectedValue = t.required[required];
    const compareValue = input.elementAspects[required];
    if (expectedValue < 0) {
      if (compareValue < -expectedValue) {
        foundRequired = true;
        break;
      }
    } else if (compareValue >= expectedValue) {
      foundRequired = true;
      break;
    }
  }
  if (!foundRequired) {
    return false;
  }

  for (const forbidden of Object.keys(t.forbidden)) {
    const expectedValue = t.forbidden[forbidden];
    const compareValue = input.elementAspects[forbidden];
    if (expectedValue < 0) {
      if (compareValue < -expectedValue) {
        return false;
      }
    } else if (compareValue >= expectedValue) {
      return false;
    }
  }

  return true;
}
