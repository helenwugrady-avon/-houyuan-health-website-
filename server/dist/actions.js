// @bun
// ../node_modules/zod/v4/core/core.js
var _a;
function $constructor(name, initializer, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _,
          traits: new Set
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0;i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");

class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// ../node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object, key, getter) {
  let value = undefined;
  Object.defineProperty(object, key, {
    get() {
      if (value === EVALUATING) {
        return;
      }
      if (value === undefined) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}

// ../node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error, path = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// ../node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parse(_Err)(schema, value, ctx);
};
var _decode = (_Err) => (schema, value, _ctx) => {
  return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parseAsync(_Err)(schema, value, ctx);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
// ../node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// ../node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst) => {
    var _a;
    (_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = new Set);
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// ../node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join(`
`));
  }
}

// ../node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 4,
  patch: 3
};

// ../node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary) => {
            return handleCanaryResult(canary, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result) => runChecks(result, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid URL format",
            input: payload.value,
            inst,
            continue: !def.abort
          });
          return;
        }
      }
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: def.hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error;
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error;
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error;
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error;
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64url";
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: undefined,
        path: [key]
      });
    }
    return;
  }
  if (result.value === undefined) {
    if (isPresent) {
      final.value[key] = undefined;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__")
      continue;
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = new Set);
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
      } else {
        handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      const schema = shape[key];
      const isOptionalIn = schema?._zod?.optin === "optional";
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(key)};`);
      if (isOptionalIn && isOptionalOut) {
        doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results, payload, inst, ctx);
    });
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left, right]) => {
        return handleIntersectionResults(payload, left, right);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = new Map;
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values) {
      payload.value = {};
      const recordKeys = new Set;
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result) => {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[outKey] = result.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result) => {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[keyResult.value] = result.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  const values = new Set(def.values);
  inst._zod.values = values;
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output) => {
        payload.value = output;
        payload.fallback = true;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    payload.fallback = true;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (input === undefined && (result.issues.length || result.fallback)) {
    return { issues: [], value: undefined };
  }
  return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, input));
      return handleOptionalResult(result, input);
    }
    if (payload.value === undefined) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleDefaultResult(result, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleNonOptionalResult(result, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => {
        payload.value = result.value;
        if (result.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
  defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
  defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? undefined);
  defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? undefined);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// ../node_modules/zod/v4/core/registries.js
var _a2;
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");

class $ZodRegistry {
  constructor() {
    this._map = new WeakMap;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new WeakMap;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
// ../node_modules/zod/v4/core/api.js
function _string(Class, params) {
  return new Class({
    type: "string",
    ...normalizeParams(params)
  });
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _null2(Class, params) {
  return new Class({
    type: "null",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _slugify() {
  return _overwrite((input) => slugify(input));
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn, params) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// ../node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {}),
    io: params?.io ?? "output",
    counter: 0,
    seen: new Map,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? undefined
  };
}
function process(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
  ctx.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema);
  if (meta)
    Object.assign(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a = result.schema).default ?? (_a.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = new Map;
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id) => id);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema = seen.schema;
    for (const key in schema) {
      delete schema[key];
    }
    schema.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error("Cycle detected: " + `#/${seen.cycle?.join("/")}/<root>` + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema = seen.def ?? seen.schema;
    const _cached = { ...schema };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema.allOf = schema.allOf ?? [];
        schema.allOf.push(refSchema);
      } else {
        Object.assign(schema, refSchema);
      }
      Object.assign(schema, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {}
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== undefined && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) {} else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: new Set };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  process(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
// ../node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
};
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time") {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json.allOf = [
        ...regexes.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
  if (typeof format === "string" && format.includes("int"))
    json.type = "integer";
  else
    json.type = "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (typeof multipleOf === "number")
    json.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var nullProcessor = (_schema, ctx, json, _params) => {
  if (ctx.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx, json, _params) => {
  const def = schema._zod.def;
  const vals = [];
  for (const val of def.values) {
    if (val === undefined) {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
      }
    } else if (typeof val === "bigint") {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {} else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var customProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
var transformProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = process(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  json.properties = {};
  const shape = def.shape;
  for (const key in shape) {
    json.properties[key] = process(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const v = def.shape[key]._zod;
    if (ctx.io === "input") {
      return v.optin === undefined;
    } else {
      return v.optout === undefined;
    }
  }));
  if (requiredKeys.size > 0) {
    json.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = process(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => process(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = process(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => ("allOf" in val) && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
};
var recordProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const keyBag = keyType._zod.bag;
  const patterns = keyBag?.patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = process(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      json.patternProperties[pattern.source] = valueSchema;
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = process(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
    }
    json.additionalProperties = process(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  if (keyValues) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues;
    }
  }
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io === "input")
    json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(undefined);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
// ../node_modules/zod/v4/classic/iso.js
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// ../node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
    },
    addIssue: {
      value: (issue) => {
        inst.issues.push(issue);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
    },
    addIssues: {
      value: (issues) => {
        inst.issues.push(...issues);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, {
  Parent: Error
});

// ../node_modules/zod/v4/classic/parse.js
var parse3 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// ../node_modules/zod/v4/classic/schemas.js
var _installedGroups = /* @__PURE__ */ new WeakMap;
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = new Set;
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v
        });
      }
    });
  }
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output")
    }
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) => parse3(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode(inst, data, params);
  inst.decode = (data, params) => decode(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    check(...chks) {
      const def = this.def;
      return this.clone(mergeDefs(def, {
        checks: [
          ...def.checks ?? [],
          ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }), { parent: true });
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def, params) {
      return clone(this, def, params);
    },
    brand() {
      return this;
    },
    register(reg, meta) {
      reg.add(this, meta);
      return this;
    },
    refine(check, params) {
      return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(_overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args) {
      if (args.length === 0)
        return globalRegistry.get(this);
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(undefined).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn) {
      return fn(this);
    }
  });
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  });
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
  _installLazyMethods(inst, "ZodNumber", {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  });
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    min(n, params) {
      return this.check(_minLength(n, params));
    },
    nonempty(params) {
      return this.check(_minLength(1, params));
    },
    max(n, params) {
      return this.check(_maxLength(n, params));
    },
    length(n, params) {
      return this.check(_length(n, params));
    },
    unwrap() {
      return this.element;
    }
  });
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  defineLazy(inst, "shape", () => {
    return def.shape;
  });
  _installLazyMethods(inst, "ZodObject", {
    keyof() {
      return _enum(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: undefined });
    },
    extend(incoming) {
      return extend(this, incoming);
    },
    safeExtend(incoming) {
      return safeExtend(this, incoming);
    },
    merge(other) {
      return merge(this, other);
    },
    pick(mask) {
      return pick(this, mask);
    },
    omit(mask) {
      return omit(this, mask);
    },
    partial(...args) {
      return partial(ZodOptional, this, args[0]);
    },
    required(...args) {
      return required(ZodNonOptional, this, args[0]);
    }
  });
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output) => {
        payload.value = output;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
function json(params) {
  const jsonSchema = lazy(() => {
    return union([string2(params), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
// ../node_modules/@hatch/space-sdk/dist/server-contract.js
var ACTION_BRAND = "@hatch/space-sdk/action/v1";
var LEGACY_ACTION_BRAND = Symbol.for("@hatch/space-sdk/action");
function createDefineAction() {
  return function defineAction(spec) {
    return {
      __brand: ACTION_BRAND,
      request: spec.request,
      response: spec.response,
      ...spec.description !== undefined ? { description: spec.description } : {},
      ...spec.privileged !== undefined ? { privileged: spec.privileged } : {},
      handler: spec.handler
    };
  };
}
// ../node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(`Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../node_modules/drizzle-orm/column.js
class Column {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = undefined;
  generated = undefined;
  generatedIdentity = undefined;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  shouldDisableInsert() {
    return this.config.generated !== undefined && this.config.generated.type !== "byDefault";
  }
}

// ../node_modules/drizzle-orm/column-builder.js
class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: undefined,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: undefined,
      uniqueType: undefined,
      dataType,
      columnType,
      generated: undefined
    };
  }
  $type() {
    return this;
  }
  notNull() {
    this.config.notNull = true;
    return this;
  }
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $default = this.$defaultFn;
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $onUpdate = this.$onUpdateFn;
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
}

// ../node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// ../node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../node_modules/drizzle-orm/pg-core/columns/enum.js
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}

// ../node_modules/drizzle-orm/subquery.js
class Subquery {
  static [entityKind] = "Subquery";
  constructor(sql, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
}

// ../node_modules/drizzle-orm/version.js
var version2 = "0.45.2";

// ../node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version2);
    }
    return iife((otel2, rawTracer2) => rawTracer2.startActiveSpan(name, (span) => {
      try {
        return fn(span);
      } catch (e) {
        span.setStatus({
          code: otel2.SpanStatusCode.ERROR,
          message: e instanceof Error ? e.message : "Unknown error"
        });
        throw e;
      } finally {
        span.end();
      }
    }), otel, rawTracer);
  }
};

// ../node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// ../node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");

class Table {
  static [entityKind] = "Table";
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  [TableName];
  [OriginalName];
  [Schema];
  [Columns];
  [ExtraConfigColumns];
  [BaseName];
  [IsAlias] = false;
  [IsDrizzleTable] = true;
  [ExtraConfigBuilder] = undefined;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}

// ../node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
  return value !== null && value !== undefined && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}

class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}

class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(schemaName === undefined ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]);
      }
    }
  }
  static [entityKind] = "SQL";
  decoder = noopDecoder;
  shouldInlineParams = false;
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === undefined) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === undefined || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === undefined ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === undefined || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== undefined) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === undefined) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  if(condition) {
    return condition ? this : undefined;
  }
}

class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};

class Param {
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== undefined) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {

  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));

class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");

class View {
  static [entityKind] = "View";
  [ViewBaseConfig];
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../node_modules/drizzle-orm/utils.js
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder;

// ../node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter((c) => c !== undefined);
  if (conditions.length === 0) {
    return;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};

// ../node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../node_modules/@hatch/space-sdk/dist/saved_product_lists.js
var SAVED_PRODUCT_LISTS_OWNER_ONLY_CODE = "saved_product_lists_owner_only";
var SAVED_PRODUCT_LISTS_UNAVAILABLE_BRAND = "@hatch/space-sdk/SavedProductListsUnavailableError/v1";

class SavedProductListsUnavailableError extends Error {
  __brand = SAVED_PRODUCT_LISTS_UNAVAILABLE_BRAND;
  code = SAVED_PRODUCT_LISTS_OWNER_ONLY_CODE;
  constructor(message = "Live saved products are available only to the Space owner", options) {
    super(message, options);
    this.name = "SavedProductListsUnavailableError";
  }
  static is(value) {
    if (value instanceof SavedProductListsUnavailableError)
      return true;
    return typeof value === "object" && value !== null && value.__brand === SAVED_PRODUCT_LISTS_UNAVAILABLE_BRAND;
  }
}
var CHECKED_FIELDS = ["name", "price", "sale_price", "currency"];
function sameSave(a, b) {
  return a.product.citation_id !== undefined && a.product.citation_id === b.product.citation_id && a.product.url === b.product.url && a.savedAt !== null && a.savedAt === b.savedAt;
}
function mergeSavedProductListsCache(previous, next) {
  if (!previous)
    return next;
  return {
    lists: next.lists.map((list) => {
      const earlier = previous.lists.find((candidate) => candidate.list === list.list);
      if (!earlier)
        return list;
      return {
        ...list,
        items: list.items.map((item) => {
          if (item.product.type !== "catalog" || item.price !== "saved" && item.price !== "refreshing") {
            return item;
          }
          const checked = earlier.items.find((candidate) => (candidate.price === "current" || candidate.price === "cached") && sameSave(candidate, item));
          if (!checked)
            return item;
          const product = { ...item.product };
          for (const field of CHECKED_FIELDS) {
            if (checked.product[field] === undefined)
              delete product[field];
            else
              product[field] = checked.product[field];
          }
          return { ...item, product, price: "cached" };
        })
      };
    })
  };
}

// ../node_modules/@hatch/space-sdk/dist/saved_products_action.js
var MAX_LISTS = 20;
var MAX_LIST_NAME_BYTES = 256;
var CACHE_TABLE = "hatch_saved_products";
var IMAGE_KEY = /^saved-products\/[0-9a-f]{64}\.img$/;
var IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
var MAX_COMMIT_ATTEMPTS = 5;
var displayMessage = string2().refine((message) => message.trim().length > 0);
var savedProductsMessagesSchema = object({
  currentPrice: displayMessage,
  lastCheckedPrice: displayMessage,
  savedPrice: displayMessage,
  snapshotNotice: displayMessage,
  unavailableNotice: displayMessage,
  ownerSharedCopyNotice: displayMessage
});
var ENGLISH_MESSAGES = {
  currentPrice: "Current price",
  lastCheckedPrice: "Last checked price",
  savedPrice: "Saved price",
  snapshotNotice: "These are the saved products from the owner's last visit; prices may have changed since.",
  unavailableNotice: "Saved products aren't available in this copy.",
  ownerSharedCopyNotice: "This is your shared copy. Open the original Space in Muse to see live saved products."
};
var SAVED_PRODUCTS_REQUEST_SCHEMA = object({}).strict();
var PRODUCT_SCHEMA = object({
  type: _enum(["catalog", "marketplace", "browser"]),
  url: string2(),
  name: string2(),
  image_url: string2().nullable().optional(),
  citation_id: string2().optional(),
  product_id: string2().optional(),
  provider: string2().optional(),
  retailer_name: string2().optional(),
  brand: string2().optional(),
  price: string2().optional(),
  sale_price: string2().optional(),
  currency: string2().optional()
}).catchall(json());
var SAVED_PRODUCTS_RESPONSE_SCHEMA = object({
  lists: array(object({
    list: string2(),
    missing: boolean2(),
    items: array(object({
      product: PRODUCT_SCHEMA,
      image: string2().nullable(),
      priceLabel: string2().nullable()
    }))
  })),
  snapshotAt: string2().nullable(),
  notice: string2().nullable()
});
function savedProductsActionFor() {
  const defineAction = createDefineAction();
  return function savedProductsAction(options) {
    const configured = options?.messages;
    const messages = configured === "en" ? ENGLISH_MESSAGES : authoredMessages(configured);
    const selection = selectionOf(options);
    return defineAction({
      request: SAVED_PRODUCTS_REQUEST_SCHEMA,
      response: SAVED_PRODUCTS_RESPONSE_SCHEMA,
      description: "Returns the owner's saved product lists for this page: live for the owner, and the owner's last saved copy for anyone else.",
      handler: (ctx) => readSavedProducts(ctx, selection, messages)
    });
  };
}
function authoredMessages(configured) {
  const result = savedProductsMessagesSchema.safeParse(configured);
  if (!result.success) {
    throw new TypeError(`savedProductsAction requires messages: "en" for an English Space or all six display messages in the Space's language`);
  }
  return result.data;
}
function selectionOf(options) {
  if (options.lists === undefined)
    return { key: "declared", lists: [] };
  const lists = [...options.lists];
  if (lists.length === 0 || lists.length > MAX_LISTS) {
    throw new TypeError("savedProductsAction takes 1 to 20 list names");
  }
  const encoder = new TextEncoder;
  for (const name of lists) {
    if (typeof name !== "string" || name.length === 0 || encoder.encode(name).length > MAX_LIST_NAME_BYTES) {
      throw new TypeError("savedProductsAction takes list names of 1 to 256 UTF-8 bytes");
    }
  }
  if (new Set(lists).size !== lists.length) {
    throw new TypeError("savedProductsAction takes unique list names");
  }
  return { key: `lists:${JSON.stringify(lists)}`, lists };
}
async function readSavedProducts(ctx, selection, messages) {
  const startedMs = Date.now();
  let live;
  try {
    live = await ctx.tool.saved_product_lists(selection.lists);
  } catch (error) {
    if (!SavedProductListsUnavailableError.is(error))
      throw error;
    return savedCopy(ctx, selection, messages);
  }
  const lists = await commitLiveRead(ctx, selection, live, startedMs);
  return {
    lists: await publicLists(ctx, lists, { live: true, messages }),
    snapshotAt: null,
    notice: null
  };
}
async function savedCopy(ctx, selection, messages) {
  const ownerCopy = ctx.viewer?.source === "cloudflare" && ctx.viewer.isOwner === true;
  const unavailable = { lists: [], snapshotAt: null, notice: ownerCopy ? messages.ownerSharedCopyNotice : messages.unavailableNotice };
  const declared = ctx.savedProductLists;
  const names = selection.lists.length === 0 ? declared : selection.lists;
  if (declared === undefined || names === undefined || names.some((name) => !declared.includes(name))) {
    return unavailable;
  }
  const db = ctx.db();
  const row = await cacheTableExists(db) ? await readRow(db, selection) : null;
  if (row === null)
    return unavailable;
  const saved = new Map(row.lists.lists.map((list) => [list.list, list]));
  const lists = names.flatMap((name) => saved.get(name) ?? []);
  if (lists.length === 0)
    return unavailable;
  return {
    lists: await publicLists(ctx, { lists }, { live: false, messages }),
    snapshotAt: row.readAt,
    notice: ownerCopy ? messages.ownerSharedCopyNotice : messages.snapshotNotice
  };
}
async function commitLiveRead(ctx, selection, live, startedMs) {
  const db = ctx.db();
  await db.run(sql`CREATE TABLE IF NOT EXISTS hatch_saved_products (
      selection TEXT PRIMARY KEY NOT NULL,
      revision INTEGER NOT NULL,
      started_ms INTEGER NOT NULL,
      read_at TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      lists TEXT NOT NULL
    )`);
  const readAt = new Date().toISOString();
  const fresh = withoutPhotoUrls(live);
  for (let attempt = 0;attempt < MAX_COMMIT_ATTEMPTS; attempt += 1) {
    const row = await readRow(db, selection);
    if (row !== null && row.startedMs > startedMs)
      return row.lists;
    const merged = mergeSavedProductListsCache(row?.lists, fresh);
    const fingerprint = await fingerprintOf(merged);
    const body = JSON.stringify(merged);
    const committed = row === null ? await db.all(sql`INSERT INTO hatch_saved_products (selection, revision, started_ms, read_at, fingerprint, lists)
              VALUES (${selection.key}, 1, ${startedMs}, ${readAt}, ${fingerprint}, ${body})
              ON CONFLICT(selection) DO NOTHING RETURNING revision`) : await db.all(sql`UPDATE hatch_saved_products
              SET revision = revision + 1, started_ms = ${startedMs}, read_at = ${readAt},
                fingerprint = ${fingerprint}, lists = ${body}
              WHERE selection = ${selection.key} AND revision = ${row.revision} RETURNING revision`);
    if (committed.length === 0)
      continue;
    if (row?.fingerprint !== fingerprint)
      ctx.invalidateQueries();
    return merged;
  }
  throw new Error("the saved products cache kept changing during this read; try again");
}
async function cacheTableExists(db) {
  const rows = await db.all(sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${CACHE_TABLE}`);
  return rows.length > 0;
}
var STORED_ITEM = object({
  product: PRODUCT_SCHEMA,
  image: _null3(),
  imageKey: string2().regex(IMAGE_KEY).nullable(),
  imageVersion: string2().min(1).nullable(),
  savedAt: string2().nullable(),
  price: _enum(["current", "saved", "refreshing", "cached"])
});
var STORED_LISTS = object({
  lists: array(object({ list: string2(), missing: boolean2(), items: array(STORED_ITEM) }))
});
var STORED_ROW = object({
  revision: number2().int(),
  started_ms: number2().int(),
  read_at: string2(),
  fingerprint: string2(),
  lists: string2()
});
async function readRow(db, selection) {
  const rows = await db.all(sql`SELECT revision, started_ms, read_at, fingerprint, lists FROM hatch_saved_products
      WHERE selection = ${selection.key}`);
  if (rows.length === 0)
    return null;
  const row = STORED_ROW.safeParse(rows[0]);
  let lists;
  try {
    lists = row.success ? JSON.parse(row.data.lists) : undefined;
  } catch {
    lists = undefined;
  }
  const parsed = STORED_LISTS.safeParse(lists);
  if (!row.success || !parsed.success) {
    throw new Error("the saved products cache in this Space's database is unreadable");
  }
  return {
    revision: row.data.revision,
    startedMs: row.data.started_ms,
    readAt: row.data.read_at,
    fingerprint: row.data.fingerprint,
    lists: parsed.data
  };
}
function withoutPhotoUrls(lists) {
  return {
    lists: lists.lists.map((list) => ({
      ...list,
      items: list.items.map((item) => ({ ...item, image: null }))
    }))
  };
}
async function fingerprintOf(lists) {
  const shown = lists.lists.map((list) => ({
    list: list.list,
    missing: list.missing,
    items: list.items.map((item) => {
      const { image_url: _expiring, ...product } = item.product;
      return {
        product,
        imageKey: item.imageKey,
        imageVersion: item.imageVersion,
        savedAt: item.savedAt,
        price: item.price === "current" || item.price === "cached" ? "checked" : "saved"
      };
    })
  }));
  const bytes = new TextEncoder().encode(canonicalJson(shown));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function canonicalJson(value) {
  if (Array.isArray(value))
    return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).filter(([, field]) => field !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return `{${entries.map(([key, field]) => `${JSON.stringify(key)}:${canonicalJson(field)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
async function publicLists(ctx, lists, { live, messages }) {
  const photos = new Map;
  const photo = (item) => {
    const { imageKey: key, imageVersion: version } = item;
    if (key === null || version === null)
      return Promise.resolve(null);
    const cacheKey = `${key}
${version}`;
    let url = photos.get(cacheKey);
    if (url === undefined) {
      url = live ? versionedUrl(ctx, key, version) : storedPhotoUrl(ctx, key);
      photos.set(cacheKey, url);
    }
    return url;
  };
  return Promise.all(lists.lists.map(async (list) => ({
    list: list.list,
    missing: list.missing,
    items: await Promise.all(list.items.map(async (item) => ({
      product: item.product,
      image: await photo(item),
      priceLabel: priceLabel(item, live, messages)
    })))
  })));
}
async function storedPhotoUrl(ctx, key) {
  const stored = await ctx.blobs.head(key);
  if (stored === null || stored.key !== key || !IMAGE_CONTENT_TYPES.has(stored.contentType) || stored.size <= 0 || stored.etag.length === 0) {
    return null;
  }
  return versionedUrl(ctx, key, stored.etag);
}
async function versionedUrl(ctx, key, version) {
  const url = await ctx.blobs.getUrl(key);
  const hash = url.indexOf("#");
  const [base, fragment] = hash === -1 ? [url, ""] : [url.slice(0, hash), url.slice(hash)];
  return `${base}${base.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}${fragment}`;
}
function priceLabel(item, live, messages) {
  const { price, sale_price: sale } = item.product;
  if (!price && !sale)
    return null;
  switch (item.price) {
    case "current":
      return live ? messages.currentPrice : messages.lastCheckedPrice;
    case "cached":
      return messages.lastCheckedPrice;
    case "saved":
    case "refreshing":
      return messages.savedPrice;
  }
}

// ../node_modules/@hatch/space-sdk/dist/index.js
var defineAction = createDefineAction();
var savedProductsAction = savedProductsActionFor();

// ../node_modules/drizzle-orm/sqlite-core/foreign-keys.js
class ForeignKeyBuilder {
  static [entityKind] = "SQLiteForeignKeyBuilder";
  reference;
  _onUpdate;
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  build(table) {
    return new ForeignKey(table, this);
  }
}

class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}

// ../node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}

// ../node_modules/drizzle-orm/sqlite-core/columns/common.js
class SQLiteColumnBuilder extends ColumnBuilder {
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
}

class SQLiteColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
}

// ../node_modules/drizzle-orm/sqlite-core/columns/blob.js
class SQLiteBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}

class SQLiteBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}

class SQLiteBlobJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  build(table) {
    return new SQLiteBlobJson(table, this.config);
  }
}

class SQLiteBlobJson extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}

class SQLiteBlobBufferBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}

class SQLiteBlobBuffer extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/custom.js
class SQLiteCustomColumnBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  build(table) {
    return new SQLiteCustomColumn(table, this.config);
  }
}

class SQLiteCustomColumn extends SQLiteColumn {
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(name, config, customTypeParams);
  };
}

// ../node_modules/drizzle-orm/sqlite-core/columns/integer.js
class SQLiteBaseIntegerBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}

class SQLiteBaseInteger extends SQLiteColumn {
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}

class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(table, this.config);
  }
}

class SQLiteInteger extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteInteger";
}

class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(table, this.config);
  }
}

class SQLiteTimestamp extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1000);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1000);
    }
    return unix;
  }
}

class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(table, this.config);
  }
}

class SQLiteBoolean extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
function integer2(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/numeric.js
class SQLiteNumericBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  build(table) {
    return new SQLiteNumeric(table, this.config);
  }
}

class SQLiteNumeric extends SQLiteColumn {
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}

class SQLiteNumericNumberBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  build(table) {
    return new SQLiteNumericNumber(table, this.config);
  }
}

class SQLiteNumericNumber extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number")
      return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}

class SQLiteNumericBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  build(table) {
    return new SQLiteNumericBigInt(table, this.config);
  }
}

class SQLiteNumericBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/real.js
class SQLiteRealBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}

class SQLiteReal extends SQLiteColumn {
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

// ../node_modules/drizzle-orm/sqlite-core/columns/text.js
class SQLiteTextBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  build(table) {
    return new SQLiteText(table, this.config);
  }
}

class SQLiteText extends SQLiteColumn {
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}

class SQLiteTextJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  build(table) {
    return new SQLiteTextJson(table, this.config);
  }
}

class SQLiteTextJson extends SQLiteColumn {
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer: integer2,
    numeric,
    real,
    text
  };
}

// ../node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");

class SQLiteTable extends Table {
  static [entityKind] = "SQLiteTable";
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  [Table.Symbol.Columns];
  [InlineForeignKeys] = [];
  [Table.Symbol.ExtraConfigBuilder] = undefined;
}
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
    const colBuilder = colBuilderBase;
    colBuilder.setName(name2);
    const column = colBuilder.build(rawTable);
    rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
    return [name2, column];
  }));
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};

// src/schema.ts
var patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  sex: text("sex").notNull(),
  age: integer2("age").notNull(),
  source: text("source").notNull(),
  stage: text("stage").notNull(),
  followUp: text("follow_up").notNull(),
  goal: text("goal").notNull(),
  status: text("status").notNull(),
  checkinDays: integer2("checkin_days").notNull(),
  measuresJson: text("measures_json").notNull()
});
var roadmapSettings = sqliteTable("roadmap_settings", {
  id: integer2("id").primaryKey(),
  week1StartDate: text("week1_start_date")
});
var roadmapTaskProgress = sqliteTable("roadmap_task_progress", {
  taskId: text("task_id").primaryKey(),
  isDone: integer2("is_done").notNull().default(0),
  notes: text("notes").notNull().default(""),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var helperProblemReports = sqliteTable("helper_problem_reports", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var teamNotes = sqliteTable("team_notes", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  fromRole: text("from_role").notNull(),
  toRole: text("to_role").notNull(),
  patientId: text("patient_id").notNull().default(""),
  text: text("text").notNull(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var myDayTasks = sqliteTable("my_day_tasks", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  roleKey: text("role_key").notNull(),
  text: text("text").notNull(),
  patientId: text("patient_id").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var dailyLogs = sqliteTable("daily_logs", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  logDate: text("log_date").notNull().unique(),
  meals: text("meals").notNull().default(""),
  mealPhotoKey: text("meal_photo_key"),
  activity: text("activity").notNull().default(""),
  activityMinutes: integer2("activity_minutes").notNull().default(0),
  highMinutes: integer2("high_minutes").notNull().default(0),
  moderateMinutes: integer2("moderate_minutes").notNull().default(0),
  lowMinutes: integer2("low_minutes").notNull().default(0),
  sedentaryMinutes: integer2("sedentary_minutes").notNull().default(0),
  sleepHours: real("sleep_hours").notNull().default(0),
  sleepSource: text("sleep_source").notNull().default("manual"),
  mood: integer2("mood").notNull().default(3),
  energy: integer2("energy").notNull().default(3),
  note: text("note").notNull().default(""),
  pavsDays: integer2("pavs_days"),
  pavsMinutes: integer2("pavs_minutes"),
  weightKg: real("weight_kg"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var weeklyReflections = sqliteTable("weekly_reflections", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull().unique(),
  text: text("text").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var wearableSettings = sqliteTable("wearable_settings", {
  id: integer2("id").primaryKey(),
  device: text("device").notNull().default(""),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var screenerResponses = sqliteTable("screener_responses", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var careTicks = sqliteTable("care_ticks", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  careDate: text("care_date").notNull(),
  itemKey: text("item_key").notNull(),
  done: integer2("done").notNull().default(0),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var careDayNotes = sqliteTable("care_day_notes", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  careDate: text("care_date").notNull().unique(),
  aideName: text("aide_name").notNull().default(""),
  familyName: text("family_name").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var exerciseRecords = sqliteTable("exercise_records", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  recordDate: text("record_date").notNull().unique(),
  preSystolic: integer2("pre_systolic"),
  preDiastolic: integer2("pre_diastolic"),
  prePulse: integer2("pre_pulse"),
  spo2: real("spo2"),
  fever: integer2("fever").notNull().default(0),
  groupA: integer2("group_a").notNull().default(0),
  groupB: integer2("group_b").notNull().default(0),
  standingDone: integer2("standing_done").notNull().default(0),
  stopSignal: integer2("stop_signal").notNull().default(0),
  totalMinutes: integer2("total_minutes").notNull().default(0),
  actionsJson: text("actions_json").notNull().default("{}"),
  discomfort: text("discomfort").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var cognitiveRecords = sqliteTable("cognitive_records", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  recordDate: text("record_date").notNull().unique(),
  morningCategory: text("morning_category").notNull().default(""),
  morningDone: integer2("morning_done").notNull().default(0),
  morningMinutes: integer2("morning_minutes").notNull().default(0),
  afternoonCategory: text("afternoon_category").notNull().default(""),
  afternoonDone: integer2("afternoon_done").notNull().default(0),
  afternoonMinutes: integer2("afternoon_minutes").notNull().default(0),
  differentOk: integer2("different_ok").notNull().default(0),
  mood: text("mood").notNull().default(""),
  response: text("response").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var seniorCheckins = sqliteTable("senior_checkins", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  checkDate: text("check_date").notNull().unique(),
  systolic: integer2("systolic"),
  diastolic: integer2("diastolic"),
  pulse: integer2("pulse"),
  appetite: text("appetite").notNull().default(""),
  mealsPct: real("meals_pct"),
  sleepHours: real("sleep_hours"),
  nightWakings: integer2("night_wakings"),
  sleepQuality: integer2("sleep_quality"),
  mood: text("mood").notNull().default(""),
  discomfort: text("discomfort").notNull().default(""),
  bowels: text("bowels").notNull().default(""),
  skinChecked: integer2("skin_checked").notNull().default(0),
  skinNote: text("skin_note").notNull().default(""),
  trainingA: integer2("training_a").notNull().default(0),
  trainingB: integer2("training_b").notNull().default(0),
  incident: text("incident").notNull().default(""),
  weightKg: real("weight_kg"),
  filledBy: text("filled_by").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var medications = sqliteTable("medications", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  drugName: text("drug_name").notNull(),
  dose: text("dose").notNull().default(""),
  frequency: text("frequency").notNull().default(""),
  timeOfDay: text("time_of_day").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  prescribedBy: text("prescribed_by").notNull().default(""),
  notes: text("notes").notNull().default(""),
  missedAction: text("missed_action").notNull().default(""),
  photoKey: text("photo_key"),
  fileName: text("file_name").notNull().default(""),
  fileKind: text("file_kind").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  active: integer2("active").notNull().default(1),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var medicationLogs = sqliteTable("medication_logs", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  medicationId: integer2("medication_id").notNull(),
  logDate: text("log_date").notNull(),
  status: text("status").notNull(),
  reason: text("reason").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var labChecks = sqliteTable("lab_checks", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  testName: text("test_name").notNull(),
  frequency: text("frequency").notNull().default(""),
  nextDue: text("next_due").notNull().default(""),
  lastResult: text("last_result").notNull().default(""),
  abnormal: integer2("abnormal").notNull().default(0),
  doctorNote: text("doctor_note").notNull().default(""),
  photoKey: text("photo_key"),
  fileName: text("file_name").notNull().default(""),
  fileKind: text("file_kind").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date),
  updatedAt: integer2("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var standingRecords = sqliteTable("standing_records", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  weekLabel: text("week_label").notNull().default(""),
  recordDate: text("record_date").notNull(),
  bedAngle: real("bed_angle"),
  standSeconds: integer2("stand_seconds"),
  kneeAngle: real("knee_angle"),
  spasmPerDay: integer2("spasm_per_day"),
  systolic: integer2("systolic"),
  diastolic: integer2("diastolic"),
  pulse: integer2("pulse"),
  spo2: real("spo2"),
  metStandard: integer2("met_standard").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var nutritionPlans = sqliteTable("nutrition_plans", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull().default(""),
  weightKg: real("weight_kg").notNull(),
  energyFactor: real("energy_factor").notNull(),
  proteinFactor: real("protein_factor").notNull(),
  fatPct: real("fat_pct").notNull(),
  carbPct: real("carb_pct").notNull(),
  totalKcal: real("total_kcal").notNull(),
  proteinG: real("protein_g").notNull(),
  fatG: real("fat_g").notNull(),
  carbG: real("carb_g").notNull(),
  proteinKcal: real("protein_kcal").notNull(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var pricingSelections = sqliteTable("pricing_selections", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  clientName: text("client_name").notNull().default(""),
  packageLabel: text("package_label").notNull().default(""),
  packagePrice: text("package_price").notNull().default(""),
  servicesJson: text("services_json").notNull().default("[]"),
  note: text("note").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var teamMembers = sqliteTable("team_members", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default(""),
  roleKey: text("role_key").notNull(),
  patientId: text("patient_id").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});
var patientTeamRoles = sqliteTable("patient_team_roles", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull(),
  roleKey: text("role_key").notNull()
});
var staffEntries = sqliteTable("staff_entries", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull(),
  week: text("week").notNull(),
  role: text("role").notNull(),
  entryDate: text("entry_date").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date)
});

// src/actions.ts
var measuresShape = object({
  weightKg: number2(),
  bodyFatPct: number2(),
  visceralFat: number2(),
  skeletalMuscleKg: number2(),
  waistCm: number2(),
  bmrKcal: number2(),
  overallScore: number2(),
  autonomicBalance: number2(),
  hba1cPct: number2(),
  fastingGlucose: number2(),
  ldl: number2(),
  triglycerides: number2(),
  systolic: number2(),
  diastolic: number2(),
  gripKg: number2(),
  walk6m: number2(),
  fmsTotal: number2(),
  phq9: number2(),
  gad7: number2(),
  psqi: number2()
});
var patientShape = object({
  id: string2(),
  sex: string2(),
  age: number2(),
  source: string2(),
  stage: string2(),
  followUp: string2(),
  goal: string2(),
  status: string2(),
  checkinDays: number2(),
  measures: measuresShape
});
var P001_MEASURES = {
  weightKg: 74.2,
  bodyFatPct: 34.7,
  visceralFat: 9,
  skeletalMuscleKg: 24.3,
  waistCm: 88,
  bmrKcal: 1372,
  overallScore: 72,
  autonomicBalance: 69,
  hba1cPct: 5.5,
  fastingGlucose: 5.8,
  ldl: 3.8,
  triglycerides: 2.5,
  systolic: 140,
  diastolic: 79,
  gripKg: 28,
  walk6m: 542,
  fmsTotal: 15,
  phq9: 7,
  gad7: 5,
  psqi: 6
};
function m(base, weightKg, hba1cPct, systolic, diastolic) {
  return { ...base, weightKg, hba1cPct, systolic, diastolic };
}
var SAMPLE_PATIENTS = [
  { id: "P001", sex: "\u5973", age: 42, source: "\u533B\u751F\u8F6C\u8BCA", stage: "\u7B2C24\u5468", followUp: "2026-11-20", goal: "\u7EF4\u6301", status: "\u7EFF", checkinDays: 6, measures: P001_MEASURES },
  { id: "P002", sex: "\u5973", age: 38, source: "\u5C0F\u7A0B\u5E8F", stage: "\u7B2C24\u5468", followUp: "2026-11-18", goal: "\u7EF4\u6301", status: "\u9EC4", checkinDays: 5, measures: m({ weightKg: 0, bodyFatPct: 32.1, visceralFat: 7, skeletalMuscleKg: 23.1, waistCm: 82, bmrKcal: 1320, overallScore: 70, autonomicBalance: 66, hba1cPct: 0, fastingGlucose: 6, ldl: 3.5, triglycerides: 2.1, systolic: 0, diastolic: 0, gripKg: 26, walk6m: 530, fmsTotal: 14, phq9: 6, gad7: 4, psqi: 6 }, 68.4, 5.9, 138, 82) },
  { id: "P003", sex: "\u5973", age: 51, source: "\u533B\u751F\u8F6C\u8BCA", stage: "\u7B2C12\u5468", followUp: "2026-11-17", goal: "\u51CF\u91CD", status: "\u9EC4", checkinDays: 3, measures: m({ weightKg: 0, bodyFatPct: 38.2, visceralFat: 11, skeletalMuscleKg: 25, waistCm: 94, bmrKcal: 1410, overallScore: 64, autonomicBalance: 61, hba1cPct: 0, fastingGlucose: 6.3, ldl: 4, triglycerides: 2.9, systolic: 0, diastolic: 0, gripKg: 24, walk6m: 498, fmsTotal: 13, phq9: 8, gad7: 6, psqi: 8 }, 81.5, 6.1, 145, 88) },
  { id: "P004", sex: "\u7537", age: 45, source: "\u5C0F\u7A0B\u5E8F", stage: "\u7B2C24\u5468", followUp: "2026-11-19", goal: "\u7EF4\u6301", status: "\u7EFF", checkinDays: 6, measures: m({ weightKg: 0, bodyFatPct: 27.4, visceralFat: 10, skeletalMuscleKg: 30.2, waistCm: 92, bmrKcal: 1650, overallScore: 74, autonomicBalance: 70, hba1cPct: 0, fastingGlucose: 5.9, ldl: 3.6, triglycerides: 2.2, systolic: 0, diastolic: 0, gripKg: 36, walk6m: 560, fmsTotal: 16, phq9: 5, gad7: 3, psqi: 5 }, 82.1, 5.7, 135, 80) },
  { id: "P005", sex: "\u7537", age: 47, source: "\u533B\u751F\u8F6C\u8BCA", stage: "\u7B2C12\u5468", followUp: "2026-11-15", goal: "\u51CF\u91CD", status: "\u7EA2", checkinDays: 2, measures: m({ weightKg: 0, bodyFatPct: 30.8, visceralFat: 13, skeletalMuscleKg: 31.5, waistCm: 101, bmrKcal: 1720, overallScore: 61, autonomicBalance: 58, hba1cPct: 0, fastingGlucose: 6.9, ldl: 4.3, triglycerides: 3.4, systolic: 0, diastolic: 0, gripKg: 34, walk6m: 487, fmsTotal: 12, phq9: 10, gad7: 7, psqi: 8 }, 89.3, 6.4, 152, 92) },
  { id: "P006", sex: "\u7537", age: 52, source: "\u793E\u533A\u7B5B\u67E5", stage: "\u7B2C12\u5468", followUp: "2026-11-16", goal: "\u51CF\u91CD", status: "\u9EC4", checkinDays: 4, measures: m({ weightKg: 0, bodyFatPct: 31.5, visceralFat: 14, skeletalMuscleKg: 32, waistCm: 104, bmrKcal: 1745, overallScore: 62, autonomicBalance: 60, hba1cPct: 0, fastingGlucose: 6.6, ldl: 4.2, triglycerides: 3.1, systolic: 0, diastolic: 0, gripKg: 33, walk6m: 476, fmsTotal: 12, phq9: 8, gad7: 6, psqi: 7 }, 92.7, 6.2, 148, 90) },
  { id: "P007", sex: "\u5973", age: 35, source: "\u5C0F\u7A0B\u5E8F", stage: "\u7B2C24\u5468", followUp: "2026-11-21", goal: "\u7EF4\u6301", status: "\u7EFF", checkinDays: 7, measures: m({ weightKg: 0, bodyFatPct: 29.6, visceralFat: 6, skeletalMuscleKg: 22.4, waistCm: 78, bmrKcal: 1290, overallScore: 78, autonomicBalance: 74, hba1cPct: 0, fastingGlucose: 5.5, ldl: 3.1, triglycerides: 1.6, systolic: 0, diastolic: 0, gripKg: 27, walk6m: 575, fmsTotal: 17, phq9: 4, gad7: 3, psqi: 5 }, 63.8, 5.4, 128, 78) },
  { id: "P008", sex: "\u7537", age: 58, source: "\u793E\u533A\u7B5B\u67E5", stage: "\u7B2C24\u5468", followUp: "2026-11-20", goal: "\u7EF4\u6301", status: "\u7EFF", checkinDays: 6, measures: m({ weightKg: 0, bodyFatPct: 28.9, visceralFat: 12, skeletalMuscleKg: 29.8, waistCm: 97, bmrKcal: 1620, overallScore: 68, autonomicBalance: 64, hba1cPct: 0, fastingGlucose: 6, ldl: 3.9, triglycerides: 2.6, systolic: 0, diastolic: 0, gripKg: 32, walk6m: 512, fmsTotal: 14, phq9: 6, gad7: 4, psqi: 7 }, 85.6, 5.8, 139, 84) },
  { id: "P009", sex: "\u5973", age: 44, source: "\u533B\u751F\u8F6C\u8BCA", stage: "\u7B2C12\u5468", followUp: "2026-11-18", goal: "\u51CF\u91CD", status: "\u9EC4", checkinDays: 5, measures: m({ weightKg: 0, bodyFatPct: 35.8, visceralFat: 10, skeletalMuscleKg: 24.8, waistCm: 90, bmrKcal: 1395, overallScore: 66, autonomicBalance: 63, hba1cPct: 0, fastingGlucose: 6.2, ldl: 3.9, triglycerides: 2.7, systolic: 0, diastolic: 0, gripKg: 25, walk6m: 505, fmsTotal: 13, phq9: 7, gad7: 5, psqi: 7 }, 76.9, 6, 142, 86) },
  { id: "P010", sex: "\u7537", age: 49, source: "\u5C0F\u7A0B\u5E8F", stage: "\u7B2C24\u5468", followUp: "2026-11-19", goal: "\u7EF4\u6301", status: "\u9EC4", checkinDays: 4, measures: m({ weightKg: 0, bodyFatPct: 29.7, visceralFat: 13, skeletalMuscleKg: 31, waistCm: 100, bmrKcal: 1705, overallScore: 63, autonomicBalance: 59, hba1cPct: 0, fastingGlucose: 6.7, ldl: 4.4, triglycerides: 3.3, systolic: 0, diastolic: 0, gripKg: 35, walk6m: 490, fmsTotal: 13, phq9: 9, gad7: 6, psqi: 8 }, 88.2, 6.3, 150, 91) },
  { id: "P011", sex: "\u5973", age: 40, source: "\u5C0F\u7A0B\u5E8F", stage: "\u7B2C24\u5468", followUp: "2026-11-21", goal: "\u7EF4\u6301", status: "\u7EFF", checkinDays: 6, measures: m({ weightKg: 0, bodyFatPct: 31.2, visceralFat: 7, skeletalMuscleKg: 23.6, waistCm: 81, bmrKcal: 1335, overallScore: 73, autonomicBalance: 69, hba1cPct: 0, fastingGlucose: 5.7, ldl: 3.4, triglycerides: 1.9, systolic: 0, diastolic: 0, gripKg: 27, walk6m: 548, fmsTotal: 16, phq9: 5, gad7: 4, psqi: 9 }, 66.5, 5.6, 131, 79) },
  { id: "P012", sex: "\u7537", age: 55, source: "\u533B\u751F\u8F6C\u8BCA", stage: "\u7B2C12\u5468", followUp: "2026-11-14", goal: "\u51CF\u91CD", status: "\u7EA2", checkinDays: 1, measures: m({ weightKg: 0, bodyFatPct: 32.6, visceralFat: 15, skeletalMuscleKg: 32.4, waistCm: 107, bmrKcal: 1760, overallScore: 58, autonomicBalance: 55, hba1cPct: 0, fastingGlucose: 7.4, ldl: 4.6, triglycerides: 3.8, systolic: 0, diastolic: 0, gripKg: 31, walk6m: 462, fmsTotal: 11, phq9: 9, gad7: 8, psqi: 9 }, 94.8, 6.8, 158, 96) },
  { id: "P013", sex: "\u5973", age: 37, source: "\u5C0F\u7A0B\u5E8F", stage: "\u7B2C24\u5468", followUp: "2026-11-20", goal: "\u7EF4\u6301", status: "\u7EFF", checkinDays: 7, measures: m({ weightKg: 0, bodyFatPct: 30.1, visceralFat: 6, skeletalMuscleKg: 22.9, waistCm: 79, bmrKcal: 1305, overallScore: 76, autonomicBalance: 72, hba1cPct: 0, fastingGlucose: 5.6, ldl: 3.2, triglycerides: 1.7, systolic: 0, diastolic: 0, gripKg: 26, walk6m: 566, fmsTotal: 17, phq9: 4, gad7: 3, psqi: 5 }, 64.2, 5.5, 129, 77) },
  { id: "P014", sex: "\u7537", age: 61, source: "\u793E\u533A\u7B5B\u67E5", stage: "\u7B2C12\u5468", followUp: "2026-11-17", goal: "\u51CF\u91CD", status: "\u9EC4", checkinDays: 3, measures: m({ weightKg: 0, bodyFatPct: 30.2, visceralFat: 14, skeletalMuscleKg: 30.6, waistCm: 102, bmrKcal: 1680, overallScore: 60, autonomicBalance: 57, hba1cPct: 0, fastingGlucose: 7, ldl: 4.5, triglycerides: 3.5, systolic: 0, diastolic: 0, gripKg: 30, walk6m: 455, fmsTotal: 11, phq9: 10, gad7: 7, psqi: 8 }, 90.4, 6.5, 151, 93) }
];
async function ensureSeeded(ctx) {
  const db = ctx.db();
  const existing = await db.select({ id: patients.id }).from(patients).limit(1);
  if (existing.length === 0) {
    for (const p of SAMPLE_PATIENTS) {
      await db.insert(patients).values({
        id: p.id,
        sex: p.sex,
        age: p.age,
        source: p.source,
        stage: p.stage,
        followUp: p.followUp,
        goal: p.goal,
        status: p.status,
        checkinDays: p.checkinDays,
        measuresJson: JSON.stringify(p.measures)
      });
    }
    return;
  }
  const entries = await db.select({ id: staffEntries.id }).from(staffEntries).limit(1);
  if (entries.length === 0) {
    for (const p of SAMPLE_PATIENTS) {
      await db.update(patients).set({
        sex: p.sex,
        age: p.age,
        source: p.source,
        stage: p.stage,
        followUp: p.followUp,
        goal: p.goal,
        status: p.status,
        checkinDays: p.checkinDays,
        measuresJson: JSON.stringify(p.measures)
      }).where(eq(patients.id, p.id));
    }
  }
}
async function loadPatients(ctx) {
  const db = ctx.db();
  const rows = await db.select().from(patients).orderBy(asc(patients.id));
  return rows.map((r) => ({
    id: r.id,
    sex: r.sex,
    age: r.age,
    source: r.source,
    stage: r.stage,
    followUp: r.followUp,
    goal: r.goal,
    status: r.status,
    checkinDays: r.checkinDays,
    measures: JSON.parse(r.measuresJson)
  }));
}
var ROADMAP_PHASES = [
  { index: 0, weekStart: 1, weekEnd: 6, labelCn: "\u7B2C0\u671F \xB7 \u6478\u5E95\xB7\u8BBE\u8BA1\xB7\u539F\u578B", labelEn: "Phase 0" },
  { index: 1, weekStart: 7, weekEnd: 10, labelCn: "\u7B2C7\u201310\u5468 \xB7 \u57F9\u8BAD\u4E0E\u542F\u52A8", labelEn: "Train & launch" },
  { index: 2, weekStart: 11, weekEnd: 22, labelCn: "\u7B2C11\u201322\u5468 \xB7 \u8BD5\u70B9", labelEn: "Pilot (12 wks)" },
  { index: 3, weekStart: 23, weekEnd: 26, labelCn: "\u7B2C23\u201326\u5468 \xB7 \u8BC4\u4F30\u4E0E\u63A8\u5E7F", labelEn: "Evaluate & scale" }
];
var ROADMAP_WORKSTREAMS = [
  { cn: "\u884C\u653F\u4E0E\u5546\u52A1", en: "Governance & commercial" },
  { cn: "\u7ECF\u8425\u4E0E\u8D22\u52A1", en: "Business operations" },
  { cn: "\u751F\u6D3B\u65B9\u5F0F\u533B\u5B66\u670D\u52A1", en: "Clinical program" },
  { cn: "\u4EBA\u5458\u4E0E\u57F9\u8BAD", en: "Workforce & training" },
  { cn: "\u5927\u6570\u636E\u5E73\u53F0", en: "Big data platform" },
  { cn: "\u5408\u89C4\u4E0E\u6570\u636E\u5B89\u5168", en: "Compliance & data security" }
];
var ROADMAP_TASKS = [
  { id: "g1", workstreamIndex: 0, phaseIndex: 0, titleEn: "Sign Phase 0 agreement: scope, fee, IP, confidentiality", owner: "joint" },
  { id: "g2", workstreamIndex: 0, phaseIndex: 0, titleEn: "Confirm signer, decision-maker and budget", owner: "container" },
  { id: "g3", workstreamIndex: 0, phaseIndex: 1, titleEn: "Gate: plan signed off, final 50% paid, path chosen", owner: "joint" },
  { id: "g4", workstreamIndex: 0, phaseIndex: 2, titleEn: "Monthly steering call with written decisions", owner: "joint" },
  { id: "g5", workstreamIndex: 0, phaseIndex: 3, titleEn: "Decide on scale-up and next-phase contract", owner: "joint" },
  { id: "b1", workstreamIndex: 1, phaseIndex: 0, titleEn: "Submit financials, client ledger, prices, staff, sites, hospital agreement", owner: "container" },
  { id: "b2", workstreamIndex: 1, phaseIndex: 0, titleEn: "Diagnostic report and business plan", owner: "ours" },
  { id: "b3", workstreamIndex: 1, phaseIndex: 1, titleEn: "Launch program packages and pricing", owner: "container" },
  { id: "b4", workstreamIndex: 1, phaseIndex: 2, titleEn: "Referrals: growth-clinic parents, hospital, returning clients", owner: "container" },
  { id: "b5", workstreamIndex: 1, phaseIndex: 2, titleEn: "Monthly conversion and revenue review", owner: "ours" },
  { id: "b6", workstreamIndex: 1, phaseIndex: 3, titleEn: "Revised pricing and scale-up plan", owner: "ours" },
  { id: "c1", workstreamIndex: 2, phaseIndex: 0, titleEn: "Program design, risk tiers, 10 SOPs, patient materials", owner: "ours" },
  { id: "c2", workstreamIndex: 2, phaseIndex: 0, titleEn: "Medical director signs referral thresholds", owner: "container" },
  { id: "c3", workstreamIndex: 2, phaseIndex: 1, titleEn: "Finalize SOPs, health plan and consent forms", owner: "joint" },
  { id: "c4", workstreamIndex: 2, phaseIndex: 2, titleEn: "Enroll 20\u201330 patients and deliver the program", owner: "container" },
  { id: "c5", workstreamIndex: 2, phaseIndex: 2, titleEn: "Track monthly retention; act on dropouts", owner: "joint" },
  { id: "c6", workstreamIndex: 2, phaseIndex: 3, titleEn: "Pilot outcomes report (week-12 re-test)", owner: "ours" },
  { id: "w1", workstreamIndex: 3, phaseIndex: 0, titleEn: "Name trainees, health managers and a coordinator", owner: "container" },
  { id: "w2", workstreamIndex: 3, phaseIndex: 0, titleEn: "Adapt 8-module curriculum and Chinese role-plays", owner: "ours" },
  { id: "w3", workstreamIndex: 3, phaseIndex: 1, titleEn: "Training two half-days a week; skills check", owner: "ours" },
  { id: "w4", workstreamIndex: 3, phaseIndex: 1, titleEn: "Staff attend and practice on site", owner: "container" },
  { id: "w5", workstreamIndex: 3, phaseIndex: 2, titleEn: "Monthly case coaching and feedback on recordings", owner: "ours" },
  { id: "w6", workstreamIndex: 3, phaseIndex: 2, titleEn: "Record sessions with patient consent", owner: "container" },
  { id: "w7", workstreamIndex: 3, phaseIndex: 3, titleEn: "Plan the next cohort and internal trainers", owner: "joint" },
  { id: "d1", workstreamIndex: 4, phaseIndex: 0, titleEn: "Send one sample report per device; old IT contract and code", owner: "container" },
  { id: "d2", workstreamIndex: 4, phaseIndex: 0, titleEn: "Data dictionary and sample-data prototype", owner: "ours" },
  { id: "d3", workstreamIndex: 4, phaseIndex: 1, titleEn: "Build in China: database, WeChat mini-program, security", owner: "ours" },
  { id: "d4", workstreamIndex: 4, phaseIndex: 1, titleEn: "Load real reports; check extracted values", owner: "container" },
  { id: "d5", workstreamIndex: 4, phaseIndex: 2, titleEn: "Enter data on schedule", owner: "container" },
  { id: "d6", workstreamIndex: 4, phaseIndex: 2, titleEn: "Monthly dashboard review", owner: "joint" },
  { id: "d7", workstreamIndex: 4, phaseIndex: 3, titleEn: "Platform v2 from pilot feedback", owner: "ours" },
  { id: "k1", workstreamIndex: 5, phaseIndex: 0, titleEn: "Provide licenses and marketing materials", owner: "container" },
  { id: "k2", workstreamIndex: 5, phaseIndex: 0, titleEn: "Agree data rules: real data stays in China", owner: "joint" },
  { id: "k3", workstreamIndex: 5, phaseIndex: 1, titleEn: "Review claims; draft PIPL consent and de-identification", owner: "ours" },
  { id: "k4", workstreamIndex: 5, phaseIndex: 2, titleEn: "Patient consent; share de-identified summaries only", owner: "container" },
  { id: "k5", workstreamIndex: 5, phaseIndex: 3, titleEn: "Ethics approval and consent if publishing", owner: "joint" }
];
function parseRoadmapDate(s) {
  const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!mm)
    return null;
  const y = Number(mm[1]);
  const mo = Number(mm[2]);
  const d = Number(mm[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d)
    return null;
  return dt;
}
function fmtRoadmapDate(dt) {
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}
function addRoadmapDays(dt, days) {
  const n = new Date(dt);
  n.setDate(n.getDate() + days);
  return n;
}
function computeRoadmapCurrent(startStr) {
  if (!startStr)
    return { currentWeek: null, currentPhaseIndex: null, status: "not_started" };
  const start = parseRoadmapDate(startStr);
  if (!start)
    return { currentWeek: null, currentPhaseIndex: null, status: "not_started" };
  const now = new Date;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0)
    return { currentWeek: null, currentPhaseIndex: null, status: "before_start" };
  const week = Math.floor(diffDays / 7) + 1;
  if (week > 26)
    return { currentWeek: week, currentPhaseIndex: null, status: "finished" };
  const phase = ROADMAP_PHASES.find((p) => week >= p.weekStart && week <= p.weekEnd);
  return { currentWeek: week, currentPhaseIndex: phase ? phase.index : null, status: "active" };
}
var roadmapTaskOut = object({
  id: string2(),
  workstreamIndex: number2(),
  phaseIndex: number2(),
  workstreamCn: string2(),
  workstreamEn: string2(),
  titleEn: string2(),
  owner: _enum(["ours", "container", "joint"]),
  weekStart: number2(),
  weekEnd: number2(),
  dateStart: string2().nullable(),
  dateEnd: string2().nullable(),
  isDone: boolean2(),
  notes: string2()
});
var roadmapStateResponse = object({
  startDate: string2().nullable(),
  currentWeek: number2().nullable(),
  currentPhaseIndex: number2().nullable(),
  status: _enum(["not_started", "before_start", "active", "finished"]),
  total: number2(),
  done: number2(),
  perPhase: array(object({ phaseIndex: number2(), total: number2(), done: number2() })),
  tasks: array(roadmapTaskOut)
});
async function loadRoadmapState(ctx) {
  const db = ctx.db();
  const settingRows = await db.select().from(roadmapSettings);
  const startDate = settingRows[0]?.week1StartDate ?? null;
  const progressRows = await db.select().from(roadmapTaskProgress);
  const map = new Map;
  for (const r of progressRows)
    map.set(r.taskId, { isDone: r.isDone === 1, notes: r.notes ?? "" });
  const tasks = ROADMAP_TASKS.map((t) => {
    const phase = ROADMAP_PHASES[t.phaseIndex];
    const ws = ROADMAP_WORKSTREAMS[t.workstreamIndex];
    const st = map.get(t.id);
    let dateStart = null;
    let dateEnd = null;
    if (startDate) {
      const s = parseRoadmapDate(startDate);
      if (s) {
        dateStart = fmtRoadmapDate(addRoadmapDays(s, (phase.weekStart - 1) * 7));
        dateEnd = fmtRoadmapDate(addRoadmapDays(s, phase.weekEnd * 7 - 1));
      }
    }
    return {
      id: t.id,
      workstreamIndex: t.workstreamIndex,
      phaseIndex: t.phaseIndex,
      workstreamCn: ws.cn,
      workstreamEn: ws.en,
      titleEn: t.titleEn,
      owner: t.owner,
      weekStart: phase.weekStart,
      weekEnd: phase.weekEnd,
      dateStart,
      dateEnd,
      isDone: st?.isDone ?? false,
      notes: st?.notes ?? ""
    };
  });
  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  const perPhase = ROADMAP_PHASES.map((p) => {
    const pt = tasks.filter((t) => t.phaseIndex === p.index);
    return { phaseIndex: p.index, total: pt.length, done: pt.filter((t) => t.isDone).length };
  });
  const cur = computeRoadmapCurrent(startDate);
  return { startDate, tasks, total, done, perPhase, currentWeek: cur.currentWeek, currentPhaseIndex: cur.currentPhaseIndex, status: cur.status };
}
var freqAnswer = number2().int().min(0).max(3).nullable();
var substanceAnswerShape = object({
  used: boolean2().nullable(),
  amountPerWeek: string2().max(200),
  concern: number2().int().min(1).max(10).nullable()
});
var screenerAnswersShape = object({
  readinessImportance: number2().int().min(0).max(10).nullable(),
  readinessConfidence: number2().int().min(0).max(10).nullable(),
  motivationTop: array(_enum(["nutrition", "activity", "sleep", "stress", "social", "substances"])).max(3),
  activityDays: number2().int().min(0).max(7).nullable(),
  activityMinutes: number2().int().min(0).max(1440).nullable(),
  activityStrengthDays: number2().int().min(0).max(7).nullable(),
  sleepBand: _enum(["lt4", "b45", "b56", "b67", "b78", "b89", "b9p"]).nullable(),
  sleepTired: freqAnswer,
  phqInterest: freqAnswer,
  phqDown: freqAnswer,
  meaningPurpose: freqAnswer,
  meaningConnected: freqAnswer,
  nicotine: substanceAnswerShape.extend({
    replacement: boolean2().nullable(),
    quitInterest: boolean2().nullable()
  }),
  alcohol: substanceAnswerShape,
  otherDrugs: substanceAnswerShape
});
var entrySummary = object({
  id: number2(),
  patientId: string2(),
  week: string2(),
  role: string2(),
  entryDate: string2()
});
var stateResponse = object({
  patients: array(patientShape),
  entryCount: number2(),
  entries: array(entrySummary)
});
function uploadKindOf(mimeType) {
  if (mimeType === "image/jpeg" || mimeType === "image/png")
    return "photo";
  if (mimeType === "application/pdf")
    return "pdf";
  if (mimeType === "application/vnd.ms-excel" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    return "excel";
  return null;
}
async function storeUpload(ctx, folder, upload) {
  const kind = uploadKindOf(upload.mimeType);
  if (!kind)
    throw new Error("Please upload a JPG/PNG photo, a PDF file, or an Excel file (.xls/.xlsx).");
  const binary = atob(upload.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  const key = `${folder}/${Date.now()}`;
  await ctx.blobs.put(key, bytes, { contentType: upload.mimeType });
  return { key, kind };
}
var uploadShape = object({
  dataBase64: string2().max(14000000),
  mimeType: string2().max(120),
  fileName: string2().max(200)
});
var Actions = {
  getState: defineAction({
    description: "Returns all patients with their latest measures, seeding the spec sample data on first load.",
    request: object({}),
    response: stateResponse,
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const patients2 = await loadPatients(ctx);
      const rows = await db.select({
        id: staffEntries.id,
        patientId: staffEntries.patientId,
        week: staffEntries.week,
        role: staffEntries.role,
        entryDate: staffEntries.entryDate
      }).from(staffEntries).orderBy(asc(staffEntries.id));
      return { patients: patients2, entryCount: rows.length, entries: rows.slice(-20).reverse() };
    }
  }),
  registerPatient: defineAction({
    description: "Registers a new patient (chain step 1: registration + consent \u2192 patient file in Patient Management). The front desk records sex, age, referral source, goal and the first follow-up date, and must confirm consent was obtained first. The patient starts at Baseline stage, amber (awaiting the first assessment), check-ins 0, and with NO measurements \u2014 every measure stays zero until the first assessment is entered through Staff entry (saveEntry), which writes the real values and the real colour.",
    request: object({
      sex: _enum(["\u5973", "\u7537"]),
      age: number2().int().min(0).max(120),
      source: _enum(["\u533B\u751F\u8F6C\u8BCA", "\u5C0F\u7A0B\u5E8F", "\u793E\u533A\u7B5B\u67E5"]),
      goal: _enum(["\u7EF4\u6301", "\u51CF\u91CD", "\u589E\u808C"]),
      followUp: string2().min(10).max(10),
      consentConfirmed: boolean2()
    }),
    response: object({ ok: literal(true), patientId: string2() }),
    async handler(ctx, args) {
      if (!args.consentConfirmed)
        throw new Error("Consent must be obtained and confirmed before registering a patient.");
      if (!parseRoadmapDate(args.followUp))
        throw new Error("Please pick a valid first follow-up date.");
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select({ id: patients.id }).from(patients);
      let maxN = 0;
      for (const r of rows) {
        const n = Number(r.id.replace(/\D/g, ""));
        if (Number.isFinite(n) && n > maxN)
          maxN = n;
      }
      const patientId = `P${String(maxN + 1).padStart(3, "0")}`;
      const zeroMeasures = {
        weightKg: 0,
        bodyFatPct: 0,
        visceralFat: 0,
        skeletalMuscleKg: 0,
        waistCm: 0,
        bmrKcal: 0,
        overallScore: 0,
        autonomicBalance: 0,
        hba1cPct: 0,
        fastingGlucose: 0,
        ldl: 0,
        triglycerides: 0,
        systolic: 0,
        diastolic: 0,
        gripKg: 0,
        walk6m: 0,
        fmsTotal: 0,
        phq9: 0,
        gad7: 0,
        psqi: 0
      };
      await db.insert(patients).values({
        id: patientId,
        sex: args.sex,
        age: args.age,
        source: args.source,
        stage: "\u57FA\u7EBF",
        followUp: args.followUp,
        goal: args.goal,
        status: "\u9EC4",
        checkinDays: 0,
        measuresJson: JSON.stringify(zeroMeasures)
      });
      ctx.invalidateQueries();
      return { ok: true, patientId };
    }
  }),
  saveEntry: defineAction({
    description: "Saves a staff entry for a patient and updates that patient's measures, status and goal.",
    request: object({
      patientId: string2().min(1).max(10),
      week: string2().min(1).max(40),
      role: string2().min(1).max(40),
      entryDate: string2().min(1).max(20),
      labDate: string2().max(20),
      heightCm: number2().min(0).max(300),
      assessment: string2().min(1).max(40),
      goal: string2().min(1).max(40),
      weeklyGoal: string2().max(500),
      teamNote: string2().max(2000),
      measures: measuresShape
    }),
    response: object({ ok: literal(true), status: string2(), patientId: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const status = args.assessment === "\u8FBE\u6807" ? "\u7EFF" : args.assessment === "\u90E8\u5206\u8FBE\u6807" ? "\u9EC4" : "\u7EA2";
      await db.insert(staffEntries).values({
        patientId: args.patientId,
        week: args.week,
        role: args.role,
        entryDate: args.entryDate,
        payloadJson: JSON.stringify(args)
      });
      await db.update(patients).set({
        measuresJson: JSON.stringify(args.measures),
        status,
        goal: args.goal,
        followUp: args.entryDate
      }).where(eq(patients.id, args.patientId));
      ctx.invalidateQueries();
      return { ok: true, status, patientId: args.patientId };
    }
  }),
  resetData: defineAction({
    description: "Deletes all staff entries and restores the 14 sample patients from the spec.",
    request: object({}),
    response: stateResponse,
    async handler(ctx) {
      const db = ctx.db();
      await db.delete(staffEntries);
      await db.delete(patients);
      for (const p of SAMPLE_PATIENTS) {
        await db.insert(patients).values({
          id: p.id,
          sex: p.sex,
          age: p.age,
          source: p.source,
          stage: p.stage,
          followUp: p.followUp,
          goal: p.goal,
          status: p.status,
          checkinDays: p.checkinDays,
          measuresJson: JSON.stringify(p.measures)
        });
      }
      ctx.invalidateQueries();
      return { patients: SAMPLE_PATIENTS, entryCount: 0, entries: [] };
    }
  }),
  getRoadmapState: defineAction({
    description: "Returns the project roadmap (Work Progress tab) start date, current week and phase, overall progress, and every task with its done status and notes. Use this to check project progress.",
    request: object({}),
    response: roadmapStateResponse,
    async handler(ctx) {
      return await loadRoadmapState(ctx);
    }
  }),
  getThisWeekTasks: defineAction({
    description: "Returns roadmap tasks due this week and overdue unchecked tasks, based on the saved Week 1 start date and today's date. Use this for reminder checks.",
    request: object({}),
    response: object({
      startDate: string2().nullable(),
      currentWeek: number2().nullable(),
      currentPhaseIndex: number2().nullable(),
      status: _enum(["not_started", "before_start", "active", "finished"]),
      dueThisWeek: array(roadmapTaskOut),
      overdue: array(roadmapTaskOut),
      uncheckedCount: number2()
    }),
    async handler(ctx) {
      const s = await loadRoadmapState(ctx);
      if (!s.startDate || s.currentWeek == null) {
        return { startDate: s.startDate, currentWeek: s.currentWeek, currentPhaseIndex: s.currentPhaseIndex, status: s.status, dueThisWeek: [], overdue: [], uncheckedCount: s.tasks.filter((t) => !t.isDone).length };
      }
      const cw = s.currentWeek;
      const dueThisWeek = s.tasks.filter((t) => cw >= t.weekStart && cw <= t.weekEnd);
      const overdue = s.tasks.filter((t) => !t.isDone && t.weekEnd < cw);
      return { startDate: s.startDate, currentWeek: s.currentWeek, currentPhaseIndex: s.currentPhaseIndex, status: s.status, dueThisWeek, overdue, uncheckedCount: s.tasks.filter((t) => !t.isDone).length };
    }
  }),
  setStartDate: defineAction({
    description: "Saves or clears the roadmap Week 1 start date (YYYY-MM-DD). All phase and task dates are computed from this date.",
    request: object({ date: string2().max(10).nullable() }),
    response: object({ ok: boolean2(), startDate: string2().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db();
      let val = null;
      if (args.date && args.date.trim() !== "") {
        const trimmed = args.date.trim();
        if (!parseRoadmapDate(trimmed))
          throw new Error("Please pick a valid date.");
        val = trimmed;
      }
      const existing = await db.select().from(roadmapSettings);
      if (existing.length === 0) {
        await db.insert(roadmapSettings).values({ id: 1, week1StartDate: val });
      } else {
        await db.update(roadmapSettings).set({ week1StartDate: val }).where(eq(roadmapSettings.id, 1));
      }
      ctx.invalidateQueries();
      return { ok: true, startDate: val };
    }
  }),
  updateTask: defineAction({
    description: "Updates one roadmap task: mark it done or not done, and/or save a short note for it.",
    request: object({
      taskId: string2().min(1).max(10),
      isDone: boolean2().optional(),
      notes: string2().max(500).optional()
    }),
    response: object({ ok: boolean2() }),
    async handler(ctx, args) {
      if (!ROADMAP_TASKS.some((t) => t.id === args.taskId))
        throw new Error("Unknown task.");
      const db = ctx.db();
      const existing = await db.select().from(roadmapTaskProgress).where(eq(roadmapTaskProgress.taskId, args.taskId));
      const cur = existing[0];
      const isDoneVal = args.isDone !== undefined ? args.isDone ? 1 : 0 : cur?.isDone ?? 0;
      const notesVal = args.notes !== undefined ? args.notes : cur?.notes ?? "";
      if (!cur) {
        await db.insert(roadmapTaskProgress).values({ taskId: args.taskId, isDone: isDoneVal, notes: notesVal, updatedAt: new Date });
      } else {
        await db.update(roadmapTaskProgress).set({ isDone: isDoneVal, notes: notesVal, updatedAt: new Date }).where(eq(roadmapTaskProgress.taskId, args.taskId));
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listProblemReports: defineAction({
    description: "Lists problem reports submitted on the Helper tab, newest first (demo feature).",
    request: object({}),
    response: object({
      reports: array(object({ id: number2(), text: string2(), createdAt: string2() }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(helperProblemReports).orderBy(desc(helperProblemReports.id)).limit(50);
      return { reports: rows.map((r) => ({ id: r.id, text: r.text, createdAt: r.createdAt.toISOString() })) };
    }
  }),
  reportProblem: defineAction({
    description: "Saves a problem report from the Helper tab so the team can see it in the reported-problems list (demo feature).",
    request: object({ text: string2().trim().min(1).max(1000) }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const inserted = await db.insert(helperProblemReports).values({ text: args.text }).returning({ id: helperProblemReports.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  listTeamNotes: defineAction({
    description: "Lists team notes left by one role for another role on the My day panel, newest first (demo feature).",
    request: object({}),
    response: object({
      notes: array(object({ id: number2(), fromRole: string2(), toRole: string2(), patientId: string2(), text: string2(), createdAt: string2() }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(teamNotes).orderBy(desc(teamNotes.id)).limit(50);
      return { notes: rows.map((r) => ({ id: r.id, fromRole: r.fromRole, toRole: r.toRole, patientId: r.patientId, text: r.text, createdAt: r.createdAt.toISOString() })) };
    }
  }),
  addTeamNote: defineAction({
    description: "Saves a note from one team role to another role on the My day panel (demo communication feature).",
    request: object({
      fromRole: string2().trim().min(1).max(60),
      toRole: string2().trim().min(1).max(60),
      patientId: string2().max(10).default(""),
      text: string2().trim().min(1).max(1000)
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const inserted = await db.insert(teamNotes).values({ fromRole: args.fromRole, toRole: args.toRole, patientId: args.patientId ?? "", text: args.text }).returning({ id: teamNotes.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  listMyDayTasks: defineAction({
    description: "Lists extra My day tasks added through the demo add-a-task box, newest first.",
    request: object({}),
    response: object({
      tasks: array(object({ id: number2(), roleKey: string2(), text: string2(), patientId: string2(), createdAt: string2() }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(myDayTasks).orderBy(desc(myDayTasks.id)).limit(100);
      return { tasks: rows.map((r) => ({ id: r.id, roleKey: r.roleKey, text: r.text, patientId: r.patientId, createdAt: r.createdAt.toISOString() })) };
    }
  }),
  listDailyLogs: defineAction({
    description: "Lists the personal daily logs (food with optional meal photo, activity split by intensity, the two always-asked activity questions, sleep and its source, mood, the day's journal note, weight) saved from the Patient app's Log my day section, oldest first.",
    request: object({}),
    response: object({
      logs: array(object({
        logDate: string2(),
        meals: string2(),
        mealPhotoUrl: string2().nullable(),
        activity: string2(),
        activityMinutes: number2(),
        highMinutes: number2(),
        moderateMinutes: number2(),
        lowMinutes: number2(),
        sedentaryMinutes: number2(),
        sleepHours: number2(),
        sleepSource: string2(),
        mood: number2(),
        energy: number2(),
        note: string2(),
        pavsDays: number2().nullable(),
        pavsMinutes: number2().nullable(),
        weightKg: number2().nullable()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(dailyLogs).orderBy(asc(dailyLogs.logDate)).limit(400);
      const logs = [];
      for (const r of rows) {
        logs.push({
          logDate: r.logDate,
          meals: r.meals,
          mealPhotoUrl: r.mealPhotoKey ? await ctx.blobs.getUrl(r.mealPhotoKey) : null,
          activity: r.activity,
          activityMinutes: r.activityMinutes,
          highMinutes: r.highMinutes,
          moderateMinutes: r.moderateMinutes,
          lowMinutes: r.lowMinutes,
          sedentaryMinutes: r.sedentaryMinutes,
          sleepHours: r.sleepHours,
          sleepSource: r.sleepSource,
          mood: r.mood,
          energy: r.energy,
          note: r.note,
          pavsDays: r.pavsDays,
          pavsMinutes: r.pavsMinutes,
          weightKg: r.weightKg
        });
      }
      return { logs };
    }
  }),
  saveDailyLog: defineAction({
    description: "Saves (or replaces) one day's personal log from the Patient app's Log my day section: meals with an optional meal photo, activity split into high/moderate/low/sedentary minutes, the two always-asked Physical Activity Vital Sign answers (days per week, minutes per day \u2014 asked every day even with a wearable linked), sleep hours and whether they came from a wearable or were typed in, mood, energy, an optional free-text journal note for the day, and optional weight. One entry per date.",
    request: object({
      logDate: string2().min(10).max(10),
      meals: string2().max(2000).default(""),
      mealPhoto: object({ dataBase64: string2().max(14000000), mimeType: string2().max(60) }).nullable().default(null),
      removeMealPhoto: boolean2().default(false),
      activity: string2().max(500).default(""),
      highMinutes: number2().int().min(0).max(1440).default(0),
      moderateMinutes: number2().int().min(0).max(1440).default(0),
      lowMinutes: number2().int().min(0).max(1440).default(0),
      sedentaryMinutes: number2().int().min(0).max(1440).default(0),
      pavsDays: number2().int().min(0).max(7).nullable().default(null),
      pavsMinutes: number2().int().min(0).max(1440).nullable().default(null),
      sleepHours: number2().min(0).max(24).default(0),
      sleepSource: _enum(["manual", "wearable"]).default("manual"),
      mood: number2().int().min(1).max(5).default(3),
      energy: number2().int().min(1).max(5).default(3),
      note: string2().max(2000).default(""),
      weightKg: number2().min(20).max(400).nullable().default(null)
    }),
    response: object({ ok: literal(true), logDate: string2() }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.logDate))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const existingRows = await db.select().from(dailyLogs).where(eq(dailyLogs.logDate, args.logDate));
      const existing = existingRows[0];
      let mealPhotoKey = existing?.mealPhotoKey ?? null;
      if (args.removeMealPhoto) {
        if (mealPhotoKey) {
          await ctx.blobs.delete(mealPhotoKey);
        }
        mealPhotoKey = null;
      }
      if (args.mealPhoto) {
        if (args.mealPhoto.mimeType !== "image/jpeg" && args.mealPhoto.mimeType !== "image/png") {
          throw new Error("Meal photo must be a JPEG or PNG image.");
        }
        const binary = atob(args.mealPhoto.dataBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0;i < binary.length; i++)
          bytes[i] = binary.charCodeAt(i);
        const key = `meal-photos/${args.logDate}-${Date.now()}`;
        await ctx.blobs.put(key, bytes, { contentType: args.mealPhoto.mimeType });
        if (mealPhotoKey && mealPhotoKey !== key) {
          await ctx.blobs.delete(mealPhotoKey);
        }
        mealPhotoKey = key;
      }
      const vals = {
        meals: args.meals,
        mealPhotoKey,
        activity: args.activity,
        activityMinutes: args.highMinutes + args.moderateMinutes + args.lowMinutes,
        highMinutes: args.highMinutes,
        moderateMinutes: args.moderateMinutes,
        lowMinutes: args.lowMinutes,
        sedentaryMinutes: args.sedentaryMinutes,
        pavsDays: args.pavsDays,
        pavsMinutes: args.pavsMinutes,
        sleepHours: args.sleepHours,
        sleepSource: args.sleepSource,
        mood: args.mood,
        energy: args.energy,
        note: args.note,
        weightKg: args.weightKg
      };
      if (!existing) {
        await db.insert(dailyLogs).values({ logDate: args.logDate, ...vals });
      } else {
        await db.update(dailyLogs).set({ ...vals, updatedAt: new Date }).where(eq(dailyLogs.logDate, args.logDate));
      }
      ctx.invalidateQueries();
      return { ok: true, logDate: args.logDate };
    }
  }),
  listWeeklyReflections: defineAction({
    description: "Lists the saved weekly reflections from the Log my day journal (one per week, keyed by the week's Monday date), oldest first. Together with the daily journal notes these form the patient's journal book.",
    request: object({}),
    response: object({
      reflections: array(object({ weekStart: string2(), text: string2(), updatedAt: string2() }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(weeklyReflections).orderBy(asc(weeklyReflections.weekStart)).limit(400);
      return { reflections: rows.map((r) => ({ weekStart: r.weekStart, text: r.text, updatedAt: r.updatedAt.toISOString() })) };
    }
  }),
  saveWeeklyReflection: defineAction({
    description: "Saves (or replaces) the weekly reflection for one week in the Log my day journal, keyed by the week's Monday date (YYYY-MM-DD). The reflection answers the neutral weekly probe about what felt easier, what felt harder, and what to remember or try next week.",
    request: object({
      weekStart: string2().min(10).max(10),
      text: string2().max(4000).default("")
    }),
    response: object({ ok: literal(true), weekStart: string2() }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.weekStart))
        throw new Error("Please pick a valid week.");
      const db = ctx.db();
      const existingRows = await db.select().from(weeklyReflections).where(eq(weeklyReflections.weekStart, args.weekStart));
      if (existingRows.length === 0) {
        await db.insert(weeklyReflections).values({ weekStart: args.weekStart, text: args.text });
      } else {
        await db.update(weeklyReflections).set({ text: args.text, updatedAt: new Date }).where(eq(weeklyReflections.weekStart, args.weekStart));
      }
      ctx.invalidateQueries();
      return { ok: true, weekStart: args.weekStart };
    }
  }),
  getWearableLink: defineAction({
    description: "Returns which wearable device the patient has linked in the Log my day section (empty string = none linked). The prototype only records the choice; real syncing comes with the real site.",
    request: object({}),
    response: object({ device: string2() }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(wearableSettings);
      return { device: rows[0]?.device ?? "" };
    }
  }),
  setWearableLink: defineAction({
    description: "Saves which wearable device the patient uses in the Log my day section (empty string unlinks it). Records the choice only \u2014 no real device syncing in the prototype.",
    request: object({ device: string2().max(60) }),
    response: object({ ok: literal(true), device: string2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const existing = await db.select().from(wearableSettings);
      if (existing.length === 0) {
        await db.insert(wearableSettings).values({ id: 1, device: args.device });
      } else {
        await db.update(wearableSettings).set({ device: args.device, updatedAt: new Date }).where(eq(wearableSettings.id, 1));
      }
      ctx.invalidateQueries();
      return { ok: true, device: args.device };
    }
  }),
  getScreenerState: defineAction({
    description: "Returns the most recently saved lifestyle medicine screener answers (Resources tab form) so the form can pre-fill, plus how many times it has been filled in.",
    request: object({}),
    response: object({
      latest: screenerAnswersShape.nullable(),
      latestAt: string2().nullable(),
      count: number2()
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(screenerResponses).orderBy(desc(screenerResponses.id)).limit(1);
      const all = await db.select({ id: screenerResponses.id }).from(screenerResponses);
      const row = rows[0];
      if (!row)
        return { latest: null, latestAt: null, count: 0 };
      let latest = null;
      try {
        latest = screenerAnswersShape.parse(JSON.parse(row.payloadJson));
      } catch {
        latest = null;
      }
      return { latest, latestAt: row.createdAt.toISOString(), count: all.length };
    }
  }),
  saveScreener: defineAction({
    description: "Saves one filled-in lifestyle medicine screener from the Resources tab (adapted ACLM / Loma Linda short form, China-adapted). Each save is kept as a new dated response; the newest one pre-fills the form next time.",
    request: screenerAnswersShape,
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const inserted = await db.insert(screenerResponses).values({ payloadJson: JSON.stringify(args) }).returning({ id: screenerResponses.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  addMyDayTask: defineAction({
    description: "Adds a task to a role's My day list through the demo add-a-task box, so the team can fill in real tasks later.",
    request: object({
      roleKey: string2().trim().min(1).max(40),
      text: string2().trim().min(1).max(500),
      patientId: string2().max(10).default("")
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const inserted = await db.insert(myDayTasks).values({ roleKey: args.roleKey, text: args.text, patientId: args.patientId ?? "" }).returning({ id: myDayTasks.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  getCareDay: defineAction({
    description: "Returns one day's 24-hour care checklist ticks and the day header (aide name, family name, day note) for the Today tab.",
    request: object({ date: string2().min(10).max(10) }),
    response: object({
      ticks: array(object({ itemKey: string2(), done: boolean2() })),
      dayNote: object({ aideName: string2(), familyName: string2(), note: string2() }).nullable()
    }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.date))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const tickRows = await db.select().from(careTicks).where(eq(careTicks.careDate, args.date));
      const noteRows = await db.select().from(careDayNotes).where(eq(careDayNotes.careDate, args.date));
      const n = noteRows[0];
      return {
        ticks: tickRows.map((r) => ({ itemKey: r.itemKey, done: r.done === 1 })),
        dayNote: n ? { aideName: n.aideName, familyName: n.familyName, note: n.note } : null
      };
    }
  }),
  getCareWeekTicks: defineAction({
    description: "Returns all 24-hour checklist ticks between two dates (inclusive), so the Exercise & Brain tab can compute this week's execution rates from the real daily ticks.",
    request: object({ from: string2().min(10).max(10), to: string2().min(10).max(10) }),
    response: object({
      ticks: array(object({ careDate: string2(), itemKey: string2(), done: boolean2() }))
    }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.from) || !parseRoadmapDate(args.to))
        throw new Error("Please pick valid dates.");
      const db = ctx.db();
      const rows = await db.select().from(careTicks).where(and(gte(careTicks.careDate, args.from), lte(careTicks.careDate, args.to))).orderBy(asc(careTicks.careDate));
      return { ticks: rows.map((r) => ({ careDate: r.careDate, itemKey: r.itemKey, done: r.done === 1 })) };
    }
  }),
  setCareTick: defineAction({
    description: "Ticks or unticks one item on one day's 24-hour care checklist (Today tab). One tap per item, saved straight away.",
    request: object({
      date: string2().min(10).max(10),
      itemKey: string2().trim().min(1).max(60),
      done: boolean2()
    }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.date))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const existing = await db.select().from(careTicks).where(eq(careTicks.careDate, args.date));
      const cur = existing.find((r) => r.itemKey === args.itemKey);
      if (!cur) {
        await db.insert(careTicks).values({ careDate: args.date, itemKey: args.itemKey, done: args.done ? 1 : 0 });
      } else {
        await db.update(careTicks).set({ done: args.done ? 1 : 0, updatedAt: new Date }).where(eq(careTicks.id, cur.id));
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  saveCareDayNote: defineAction({
    description: "Saves the Today checklist day header for one date: who is on duty (aide name, family name) and the end-of-day note.",
    request: object({
      date: string2().min(10).max(10),
      aideName: string2().max(60).default(""),
      familyName: string2().max(60).default(""),
      note: string2().max(2000).default("")
    }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.date))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const existing = await db.select().from(careDayNotes).where(eq(careDayNotes.careDate, args.date));
      const vals = { aideName: args.aideName, familyName: args.familyName, note: args.note };
      if (existing.length === 0) {
        await db.insert(careDayNotes).values({ careDate: args.date, ...vals });
      } else {
        await db.update(careDayNotes).set({ ...vals, updatedAt: new Date }).where(eq(careDayNotes.careDate, args.date));
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  saveExerciseRecord: defineAction({
    description: "Saves one day's exercise record from the Exercise & Brain tab: pre-training BP/pulse/SpO2 and fever flag (the safety pre-check), per-action done/actual counts for the seated A and B groups, standing done, whether a stop signal appeared, total minutes and any discomfort note. One record per date.",
    request: object({
      recordDate: string2().min(10).max(10),
      preSystolic: number2().int().min(0).max(300).nullable().default(null),
      preDiastolic: number2().int().min(0).max(200).nullable().default(null),
      prePulse: number2().int().min(0).max(250).nullable().default(null),
      spo2: number2().min(0).max(100).nullable().default(null),
      fever: boolean2().default(false),
      groupA: boolean2().default(false),
      groupB: boolean2().default(false),
      standingDone: boolean2().default(false),
      stopSignal: boolean2().default(false),
      totalMinutes: number2().int().min(0).max(1440).default(0),
      actions: record(string2().max(60), object({ done: boolean2(), actual: string2().max(60) })).default({}),
      discomfort: string2().max(2000).default("")
    }),
    response: object({ ok: literal(true), recordDate: string2() }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.recordDate))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const vals = {
        preSystolic: args.preSystolic,
        preDiastolic: args.preDiastolic,
        prePulse: args.prePulse,
        spo2: args.spo2,
        fever: args.fever ? 1 : 0,
        groupA: args.groupA ? 1 : 0,
        groupB: args.groupB ? 1 : 0,
        standingDone: args.standingDone ? 1 : 0,
        stopSignal: args.stopSignal ? 1 : 0,
        totalMinutes: args.totalMinutes,
        actionsJson: JSON.stringify(args.actions),
        discomfort: args.discomfort
      };
      const existing = await db.select().from(exerciseRecords).where(eq(exerciseRecords.recordDate, args.recordDate));
      if (existing.length === 0) {
        await db.insert(exerciseRecords).values({ recordDate: args.recordDate, ...vals });
      } else {
        await db.update(exerciseRecords).set({ ...vals, updatedAt: new Date }).where(eq(exerciseRecords.recordDate, args.recordDate));
      }
      ctx.invalidateQueries();
      return { ok: true, recordDate: args.recordDate };
    }
  }),
  listExerciseRecords: defineAction({
    description: "Lists saved daily exercise records (Exercise & Brain tab), newest date first.",
    request: object({}),
    response: object({
      records: array(object({
        recordDate: string2(),
        preSystolic: number2().nullable(),
        preDiastolic: number2().nullable(),
        prePulse: number2().nullable(),
        spo2: number2().nullable(),
        fever: boolean2(),
        groupA: boolean2(),
        groupB: boolean2(),
        standingDone: boolean2(),
        stopSignal: boolean2(),
        totalMinutes: number2(),
        actions: record(string2(), object({ done: boolean2(), actual: string2() })),
        discomfort: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(exerciseRecords).orderBy(desc(exerciseRecords.recordDate)).limit(120);
      return {
        records: rows.map((r) => {
          let actions = {};
          try {
            actions = JSON.parse(r.actionsJson);
          } catch {
            actions = {};
          }
          return {
            recordDate: r.recordDate,
            preSystolic: r.preSystolic,
            preDiastolic: r.preDiastolic,
            prePulse: r.prePulse,
            spo2: r.spo2,
            fever: r.fever === 1,
            groupA: r.groupA === 1,
            groupB: r.groupB === 1,
            standingDone: r.standingDone === 1,
            stopSignal: r.stopSignal === 1,
            totalMinutes: r.totalMinutes,
            actions,
            discomfort: r.discomfort
          };
        })
      };
    }
  }),
  saveCognitiveRecord: defineAction({
    description: "Saves one day's cognitive training record from the Exercise & Brain tab: morning and afternoon sessions (category, done, minutes), whether the two sessions were different, the person's mood/cooperation, and a short response note. One record per date.",
    request: object({
      recordDate: string2().min(10).max(10),
      morningCategory: string2().max(60).default(""),
      morningDone: boolean2().default(false),
      morningMinutes: number2().int().min(0).max(600).default(0),
      afternoonCategory: string2().max(60).default(""),
      afternoonDone: boolean2().default(false),
      afternoonMinutes: number2().int().min(0).max(600).default(0),
      differentOk: boolean2().default(false),
      mood: string2().max(20).default(""),
      response: string2().max(2000).default("")
    }),
    response: object({ ok: literal(true), recordDate: string2() }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.recordDate))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const vals = {
        morningCategory: args.morningCategory,
        morningDone: args.morningDone ? 1 : 0,
        morningMinutes: args.morningMinutes,
        afternoonCategory: args.afternoonCategory,
        afternoonDone: args.afternoonDone ? 1 : 0,
        afternoonMinutes: args.afternoonMinutes,
        differentOk: args.differentOk ? 1 : 0,
        mood: args.mood,
        response: args.response
      };
      const existing = await db.select().from(cognitiveRecords).where(eq(cognitiveRecords.recordDate, args.recordDate));
      if (existing.length === 0) {
        await db.insert(cognitiveRecords).values({ recordDate: args.recordDate, ...vals });
      } else {
        await db.update(cognitiveRecords).set({ ...vals, updatedAt: new Date }).where(eq(cognitiveRecords.recordDate, args.recordDate));
      }
      ctx.invalidateQueries();
      return { ok: true, recordDate: args.recordDate };
    }
  }),
  listCognitiveRecords: defineAction({
    description: "Lists saved daily cognitive training records (Exercise & Brain tab), newest date first.",
    request: object({}),
    response: object({
      records: array(object({
        recordDate: string2(),
        morningCategory: string2(),
        morningDone: boolean2(),
        morningMinutes: number2(),
        afternoonCategory: string2(),
        afternoonDone: boolean2(),
        afternoonMinutes: number2(),
        differentOk: boolean2(),
        mood: string2(),
        response: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(cognitiveRecords).orderBy(desc(cognitiveRecords.recordDate)).limit(120);
      return {
        records: rows.map((r) => ({
          recordDate: r.recordDate,
          morningCategory: r.morningCategory,
          morningDone: r.morningDone === 1,
          morningMinutes: r.morningMinutes,
          afternoonCategory: r.afternoonCategory,
          afternoonDone: r.afternoonDone === 1,
          afternoonMinutes: r.afternoonMinutes,
          differentOk: r.differentOk === 1,
          mood: r.mood,
          response: r.response
        }))
      };
    }
  }),
  saveSeniorCheckin: defineAction({
    description: "Saves (merging with anything already saved for that date) one day's senior-care health check-in. The Today tab's evening check-in and the Patient app's daily check-in write to the same record: fields a form does not send keep their saved values, so the aide/family evening form and the patient's own mood/appetite/sleep/discomfort report never wipe each other out. One record per date.",
    request: object({
      checkDate: string2().min(10).max(10),
      systolic: number2().int().min(0).max(300).nullable().optional(),
      diastolic: number2().int().min(0).max(200).nullable().optional(),
      pulse: number2().int().min(0).max(250).nullable().optional(),
      appetite: string2().max(20).optional(),
      mealsPct: number2().min(0).max(10).nullable().optional(),
      sleepHours: number2().min(0).max(24).nullable().optional(),
      nightWakings: number2().int().min(0).max(30).nullable().optional(),
      sleepQuality: number2().int().min(1).max(5).nullable().optional(),
      mood: string2().max(20).optional(),
      discomfort: string2().max(2000).optional(),
      bowels: string2().max(200).optional(),
      skinChecked: boolean2().optional(),
      skinNote: string2().max(500).optional(),
      trainingA: boolean2().optional(),
      trainingB: boolean2().optional(),
      incident: string2().max(2000).optional(),
      weightKg: number2().min(20).max(400).nullable().optional(),
      filledBy: string2().max(40).optional()
    }),
    response: object({ ok: literal(true), checkDate: string2() }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.checkDate))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const existingRows = await db.select().from(seniorCheckins).where(eq(seniorCheckins.checkDate, args.checkDate));
      const cur = existingRows[0];
      const merged = {
        systolic: args.systolic !== undefined ? args.systolic : cur?.systolic ?? null,
        diastolic: args.diastolic !== undefined ? args.diastolic : cur?.diastolic ?? null,
        pulse: args.pulse !== undefined ? args.pulse : cur?.pulse ?? null,
        appetite: args.appetite !== undefined ? args.appetite : cur?.appetite ?? "",
        mealsPct: args.mealsPct !== undefined ? args.mealsPct : cur?.mealsPct ?? null,
        sleepHours: args.sleepHours !== undefined ? args.sleepHours : cur?.sleepHours ?? null,
        nightWakings: args.nightWakings !== undefined ? args.nightWakings : cur?.nightWakings ?? null,
        sleepQuality: args.sleepQuality !== undefined ? args.sleepQuality : cur?.sleepQuality ?? null,
        mood: args.mood !== undefined ? args.mood : cur?.mood ?? "",
        discomfort: args.discomfort !== undefined ? args.discomfort : cur?.discomfort ?? "",
        bowels: args.bowels !== undefined ? args.bowels : cur?.bowels ?? "",
        skinChecked: args.skinChecked !== undefined ? args.skinChecked ? 1 : 0 : cur?.skinChecked ?? 0,
        skinNote: args.skinNote !== undefined ? args.skinNote : cur?.skinNote ?? "",
        trainingA: args.trainingA !== undefined ? args.trainingA ? 1 : 0 : cur?.trainingA ?? 0,
        trainingB: args.trainingB !== undefined ? args.trainingB ? 1 : 0 : cur?.trainingB ?? 0,
        incident: args.incident !== undefined ? args.incident : cur?.incident ?? "",
        weightKg: args.weightKg !== undefined ? args.weightKg : cur?.weightKg ?? null,
        filledBy: args.filledBy !== undefined ? args.filledBy : cur?.filledBy ?? ""
      };
      if (!cur) {
        await db.insert(seniorCheckins).values({ checkDate: args.checkDate, ...merged });
      } else {
        await db.update(seniorCheckins).set({ ...merged, updatedAt: new Date }).where(eq(seniorCheckins.checkDate, args.checkDate));
      }
      ctx.invalidateQueries();
      return { ok: true, checkDate: args.checkDate };
    }
  }),
  listSeniorCheckins: defineAction({
    description: "Lists saved senior-care daily health check-ins (Today evening check-in and Patient app daily check-in share these records), newest date first.",
    request: object({}),
    response: object({
      checkins: array(object({
        checkDate: string2(),
        systolic: number2().nullable(),
        diastolic: number2().nullable(),
        pulse: number2().nullable(),
        appetite: string2(),
        mealsPct: number2().nullable(),
        sleepHours: number2().nullable(),
        nightWakings: number2().nullable(),
        sleepQuality: number2().nullable(),
        mood: string2(),
        discomfort: string2(),
        bowels: string2(),
        skinChecked: boolean2(),
        skinNote: string2(),
        trainingA: boolean2(),
        trainingB: boolean2(),
        incident: string2(),
        weightKg: number2().nullable(),
        filledBy: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(seniorCheckins).orderBy(desc(seniorCheckins.checkDate)).limit(180);
      return {
        checkins: rows.map((r) => ({
          checkDate: r.checkDate,
          systolic: r.systolic,
          diastolic: r.diastolic,
          pulse: r.pulse,
          appetite: r.appetite,
          mealsPct: r.mealsPct,
          sleepHours: r.sleepHours,
          nightWakings: r.nightWakings,
          sleepQuality: r.sleepQuality,
          mood: r.mood,
          discomfort: r.discomfort,
          bowels: r.bowels,
          skinChecked: r.skinChecked === 1,
          skinNote: r.skinNote,
          trainingA: r.trainingA === 1,
          trainingB: r.trainingB === 1,
          incident: r.incident,
          weightKg: r.weightKg,
          filledBy: r.filledBy
        }))
      };
    }
  }),
  listTeamMembers: defineAction({
    description: "Lists the Team members (Patient Management): each real person assigned to one role and to the patient they serve in that role. The first call seeds the people Helen has named \u2014 Helen, her sister and her brother as the family role for her dad (Patient Zero), and her dad as Patient Zero \u2014 plus empty care-team slots (nurse, doctor, dietitian, therapist, health manager, aide) whose names are filled in later. Different patients can have different members.",
    request: object({}),
    response: object({
      members: array(object({
        id: number2(),
        name: string2(),
        roleKey: string2(),
        patientId: string2(),
        note: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const existing = await db.select().from(teamMembers).orderBy(asc(teamMembers.id));
      if (existing.length === 0) {
        const seed = [
          { name: "Helen", roleKey: "family", patientId: "patient-zero", note: "\u5BB6\u4EBA Family" },
          { name: "\u59D0\u59D0 Sister", roleKey: "family", patientId: "patient-zero", note: "\u5BB6\u4EBA Family \u2014 \u771F\u540D\u5F85\u586B Real name to fill in" },
          { name: "\u54E5\u54E5 Brother", roleKey: "family", patientId: "patient-zero", note: "\u5BB6\u4EBA Family \u2014 \u771F\u540D\u5F85\u586B Real name to fill in" },
          { name: "\u7238\u7238 Dad", roleKey: "patient", patientId: "patient-zero", note: "Patient Zero \xB7 \u7B2C\u4E00\u4F4D\u60A3\u8005 First patient" },
          { name: "", roleKey: "nurse", patientId: "", note: "" },
          { name: "", roleKey: "doctor", patientId: "", note: "" },
          { name: "", roleKey: "dietitian", patientId: "", note: "" },
          { name: "", roleKey: "exercise", patientId: "", note: "" },
          { name: "", roleKey: "manager", patientId: "", note: "" },
          { name: "", roleKey: "aide", patientId: "", note: "" }
        ];
        for (const s of seed) {
          await db.insert(teamMembers).values(s);
        }
        const rows = await db.select().from(teamMembers).orderBy(asc(teamMembers.id));
        return { members: rows.map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey, patientId: r.patientId, note: r.note })) };
      }
      return { members: existing.map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey, patientId: r.patientId, note: r.note })) };
    }
  }),
  saveTeamMember: defineAction({
    description: "Adds a team member, or updates one when an id is given: the person's name (blank means an empty slot to fill in later), the ONE role they are assigned to, and the patient they serve in that role (a patient id, 'patient-zero' for Helen's dad, or blank for not assigned yet).",
    request: object({
      id: number2().int().positive().optional(),
      name: string2().max(80).default(""),
      roleKey: string2().min(1).max(40),
      patientId: string2().max(40).default(""),
      note: string2().max(300).default("")
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const vals = { name: args.name.trim(), roleKey: args.roleKey, patientId: args.patientId, note: args.note };
      if (args.id) {
        await db.update(teamMembers).set(vals).where(eq(teamMembers.id, args.id));
        ctx.invalidateQueries();
        return { ok: true, id: args.id };
      }
      const inserted = await db.insert(teamMembers).values(vals).returning({ id: teamMembers.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  deleteTeamMember: defineAction({
    description: "Removes a person (or an empty slot) from the Team members list.",
    request: object({ id: number2().int().positive() }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.delete(teamMembers).where(eq(teamMembers.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listPatientTeamRoles: defineAction({
    description: "Lists which roles are on each patient's team (patient_id + role_key pairs). Choosing a role for a patient brings that role's task list for that patient. Patient Zero starts with all seven roles (family, nurse, doctor, dietitian, therapist, health manager, aide) \u2014 the structure of his care plan; other patients start with none chosen.",
    request: object({}),
    response: object({
      pairs: array(object({ patientId: string2(), roleKey: string2() }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const existing = await db.select().from(patientTeamRoles).orderBy(asc(patientTeamRoles.id));
      if (existing.length === 0) {
        const roles = ["family", "nurse", "doctor", "dietitian", "exercise", "manager", "aide"];
        for (const roleKey of roles) {
          await db.insert(patientTeamRoles).values({ patientId: "patient-zero", roleKey });
        }
        const rows = await db.select().from(patientTeamRoles).orderBy(asc(patientTeamRoles.id));
        return { pairs: rows.map((r) => ({ patientId: r.patientId, roleKey: r.roleKey })) };
      }
      return { pairs: existing.map((r) => ({ patientId: r.patientId, roleKey: r.roleKey })) };
    }
  }),
  setPatientTeamRole: defineAction({
    description: "Adds a role to a patient's team (on=true) or removes it (on=false). Adding a role brings that role's tasks for that patient; the person who does them is the team member assigned to that role for that patient.",
    request: object({
      patientId: string2().min(1).max(40),
      roleKey: string2().min(1).max(40),
      on: boolean2()
    }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db.select().from(patientTeamRoles).where(and(eq(patientTeamRoles.patientId, args.patientId), eq(patientTeamRoles.roleKey, args.roleKey)));
      if (args.on && rows.length === 0) {
        await db.insert(patientTeamRoles).values({ patientId: args.patientId, roleKey: args.roleKey });
      } else if (!args.on) {
        for (const r of rows) {
          await db.delete(patientTeamRoles).where(eq(patientTeamRoles.id, r.id));
        }
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listMedications: defineAction({
    description: "Lists the medication list (each entry with its uploaded prescription attachment \u2014 a photo URL for a photo, or the file name and kind for a PDF/Excel file) and the daily taken/missed ticks (Medications & Labs tab). The list starts empty \u2014 the doctor's actual prescription is entered here when provided; the site only records what was prescribed and whether it was taken, it never prescribes.",
    request: object({}),
    response: object({
      medications: array(object({
        id: number2(),
        drugName: string2(),
        dose: string2(),
        frequency: string2(),
        timeOfDay: string2(),
        startDate: string2(),
        endDate: string2(),
        prescribedBy: string2(),
        notes: string2(),
        missedAction: string2(),
        active: boolean2(),
        photoUrl: string2().nullable(),
        fileName: string2(),
        fileKind: string2(),
        enteredBy: string2()
      })),
      logs: array(object({
        id: number2(),
        medicationId: number2(),
        logDate: string2(),
        status: string2(),
        reason: string2(),
        enteredBy: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const meds = await db.select().from(medications).orderBy(asc(medications.id));
      const logs = await db.select().from(medicationLogs).orderBy(desc(medicationLogs.logDate)).limit(1000);
      return {
        medications: await Promise.all(meds.map(async (r) => ({
          id: r.id,
          drugName: r.drugName,
          dose: r.dose,
          frequency: r.frequency,
          timeOfDay: r.timeOfDay,
          startDate: r.startDate,
          endDate: r.endDate,
          prescribedBy: r.prescribedBy,
          notes: r.notes,
          missedAction: r.missedAction,
          active: r.active === 1,
          photoUrl: r.photoKey && r.fileKind === "photo" ? await ctx.blobs.getUrl(r.photoKey) : null,
          fileName: r.fileName,
          fileKind: r.fileKind,
          enteredBy: r.enteredBy
        }))),
        logs: logs.map((r) => ({ id: r.id, medicationId: r.medicationId, logDate: r.logDate, status: r.status, reason: r.reason, enteredBy: r.enteredBy }))
      };
    }
  }),
  saveMedication: defineAction({
    description: "Adds a medicine to the medication list, or updates it when an id is given: name, dose, frequency, time of day (tied to meals), start/end dates, prescribing doctor, notes, what to do if a dose is missed (written down in advance, per the doctor's instructions), and optionally one uploaded prescription attachment from the family \u2014 a JPG/PNG photo, a PDF file, or an Excel file, stored as an owned blob and kept as the source (removeUpload deletes it).",
    request: object({
      id: number2().int().positive().optional(),
      drugName: string2().trim().min(1).max(200),
      dose: string2().max(100).default(""),
      frequency: string2().max(60).default(""),
      timeOfDay: string2().max(60).default(""),
      startDate: string2().max(20).default(""),
      endDate: string2().max(20).default(""),
      prescribedBy: string2().max(100).default(""),
      notes: string2().max(1000).default(""),
      missedAction: string2().max(1000).default(""),
      active: boolean2().default(true),
      upload: uploadShape.nullable().default(null),
      removeUpload: boolean2().default(false),
      enteredBy: string2().max(120).default("")
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      let photoKey = null;
      let fileName = "";
      let fileKind = "";
      let enteredBy = args.enteredBy;
      if (args.id) {
        const existing = (await db.select().from(medications).where(eq(medications.id, args.id)))[0];
        photoKey = existing?.photoKey ?? null;
        fileName = existing?.fileName ?? "";
        fileKind = existing?.fileKind ?? "";
        if (!enteredBy)
          enteredBy = existing?.enteredBy ?? "";
      }
      if (args.removeUpload) {
        if (photoKey) {
          await ctx.blobs.delete(photoKey);
        }
        photoKey = null;
        fileName = "";
        fileKind = "";
      }
      if (args.upload) {
        const stored = await storeUpload(ctx, "prescription-files", args.upload);
        if (photoKey && photoKey !== stored.key) {
          await ctx.blobs.delete(photoKey);
        }
        photoKey = stored.key;
        fileKind = stored.kind;
        fileName = args.upload.fileName.trim() || (stored.kind === "photo" ? "\u5904\u65B9\u7167\u7247 Prescription photo" : stored.kind === "pdf" ? "\u5904\u65B9 PDF Prescription PDF" : "\u5904\u65B9\u8868\u683C Prescription spreadsheet");
      }
      const vals = {
        drugName: args.drugName,
        dose: args.dose,
        frequency: args.frequency,
        timeOfDay: args.timeOfDay,
        startDate: args.startDate,
        endDate: args.endDate,
        prescribedBy: args.prescribedBy,
        notes: args.notes,
        missedAction: args.missedAction,
        active: args.active ? 1 : 0,
        photoKey,
        fileName,
        fileKind,
        enteredBy
      };
      if (args.id) {
        await db.update(medications).set({ ...vals, updatedAt: new Date }).where(eq(medications.id, args.id));
        ctx.invalidateQueries();
        return { ok: true, id: args.id };
      }
      const inserted = await db.insert(medications).values(vals).returning({ id: medications.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  deleteMedication: defineAction({
    description: "Removes a medicine from the medication list together with its taken/missed ticks.",
    request: object({ id: number2().int().positive() }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const existing = (await db.select().from(medications).where(eq(medications.id, args.id)))[0];
      if (existing?.photoKey) {
        await ctx.blobs.delete(existing.photoKey);
      }
      await db.delete(medicationLogs).where(eq(medicationLogs.medicationId, args.id));
      await db.delete(medications).where(eq(medications.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  logMedication: defineAction({
    description: "Records one day's tick for one medicine on the Medications & Labs daily-ticks screen: taken, or missed with a reason \u2014 plus who ticked it (the person giving the medicine: aide or family). Status 'none' clears the tick.",
    request: object({
      medicationId: number2().int().positive(),
      logDate: string2().min(10).max(10),
      status: _enum(["taken", "missed", "none"]),
      reason: string2().max(500).default(""),
      enteredBy: string2().max(120).default("")
    }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.logDate))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const existing = await db.select().from(medicationLogs).where(eq(medicationLogs.medicationId, args.medicationId));
      const cur = existing.find((r) => r.logDate === args.logDate);
      if (args.status === "none") {
        if (cur)
          await db.delete(medicationLogs).where(eq(medicationLogs.id, cur.id));
      } else if (!cur) {
        await db.insert(medicationLogs).values({ medicationId: args.medicationId, logDate: args.logDate, status: args.status, reason: args.reason, enteredBy: args.enteredBy });
      } else {
        await db.update(medicationLogs).set({ status: args.status, reason: args.reason, enteredBy: args.enteredBy || cur.enteredBy, updatedAt: new Date }).where(eq(medicationLogs.id, cur.id));
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listLabChecks: defineAction({
    description: "Lists the lab-check schedule (Medications & Labs tab): each test, how often, next due date, last result, abnormal flag, the doctor's note, and the uploaded lab report attachment when the family has provided one (a photo URL for a photo of the paper report or of the PDF on screen, or the file name and kind for a PDF/Excel file \u2014 the upload stays as the source of the typed values). Starts empty \u2014 the schedule (e.g. monthly blood work, annual full blood check) is entered as the doctor arranges it.",
    request: object({}),
    response: object({
      checks: array(object({
        id: number2(),
        testName: string2(),
        frequency: string2(),
        nextDue: string2(),
        lastResult: string2(),
        abnormal: boolean2(),
        doctorNote: string2(),
        photoUrl: string2().nullable(),
        fileName: string2(),
        fileKind: string2(),
        enteredBy: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(labChecks).orderBy(asc(labChecks.id));
      return {
        checks: await Promise.all(rows.map(async (r) => ({
          id: r.id,
          testName: r.testName,
          frequency: r.frequency,
          nextDue: r.nextDue,
          lastResult: r.lastResult,
          abnormal: r.abnormal === 1,
          doctorNote: r.doctorNote,
          photoUrl: r.photoKey && r.fileKind === "photo" ? await ctx.blobs.getUrl(r.photoKey) : null,
          fileName: r.fileName,
          fileKind: r.fileKind,
          enteredBy: r.enteredBy
        })))
      };
    }
  }),
  saveLabCheck: defineAction({
    description: "Adds a lab check to the schedule, or updates it when an id is given: test name, frequency, next due date, last result, whether it was abnormal, the doctor's follow-up note, and optionally one uploaded lab report attachment from the family \u2014 a JPG/PNG photo (of the paper report or of the PDF on screen), the PDF file itself, or an Excel file, stored as an owned blob and kept as the source of the typed values (removeUpload deletes it).",
    request: object({
      id: number2().int().positive().optional(),
      testName: string2().trim().min(1).max(200),
      frequency: string2().max(60).default(""),
      nextDue: string2().max(20).default(""),
      lastResult: string2().max(500).default(""),
      abnormal: boolean2().default(false),
      doctorNote: string2().max(1000).default(""),
      upload: uploadShape.nullable().default(null),
      removeUpload: boolean2().default(false),
      enteredBy: string2().max(120).default("")
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      let photoKey = null;
      let fileName = "";
      let fileKind = "";
      let enteredBy = args.enteredBy;
      if (args.id) {
        const existing = (await db.select().from(labChecks).where(eq(labChecks.id, args.id)))[0];
        photoKey = existing?.photoKey ?? null;
        fileName = existing?.fileName ?? "";
        fileKind = existing?.fileKind ?? "";
        if (!enteredBy)
          enteredBy = existing?.enteredBy ?? "";
      }
      if (args.removeUpload) {
        if (photoKey) {
          await ctx.blobs.delete(photoKey);
        }
        photoKey = null;
        fileName = "";
        fileKind = "";
      }
      if (args.upload) {
        const stored = await storeUpload(ctx, "lab-report-files", args.upload);
        if (photoKey && photoKey !== stored.key) {
          await ctx.blobs.delete(photoKey);
        }
        photoKey = stored.key;
        fileKind = stored.kind;
        fileName = args.upload.fileName.trim() || (stored.kind === "photo" ? "\u5316\u9A8C\u62A5\u544A\u7167\u7247 Lab report photo" : stored.kind === "pdf" ? "\u5316\u9A8C\u62A5\u544A PDF Lab report PDF" : "\u5316\u9A8C\u62A5\u544A\u8868\u683C Lab report spreadsheet");
      }
      const vals = {
        testName: args.testName,
        frequency: args.frequency,
        nextDue: args.nextDue,
        lastResult: args.lastResult,
        abnormal: args.abnormal ? 1 : 0,
        doctorNote: args.doctorNote,
        photoKey,
        fileName,
        fileKind,
        enteredBy
      };
      if (args.id) {
        await db.update(labChecks).set({ ...vals, updatedAt: new Date }).where(eq(labChecks.id, args.id));
        ctx.invalidateQueries();
        return { ok: true, id: args.id };
      }
      const inserted = await db.insert(labChecks).values(vals).returning({ id: labChecks.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  deleteLabCheck: defineAction({
    description: "Removes one lab check from the schedule.",
    request: object({ id: number2().int().positive() }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const existing = (await db.select().from(labChecks).where(eq(labChecks.id, args.id)))[0];
      if (existing?.photoKey) {
        await ctx.blobs.delete(existing.photoKey);
      }
      await db.delete(labChecks).where(eq(labChecks.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  saveStandingRecord: defineAction({
    description: "Saves one weekly standing-progression monitoring record from the Staff Entry team forms (rehab therapist): week, date, standing-bed angle, supported-standing seconds, passive knee angle, spasms per day, BP, pulse, SpO2, whether the stage standard was met, and notes.",
    request: object({
      weekLabel: string2().max(40).default(""),
      recordDate: string2().min(10).max(10),
      bedAngle: number2().min(0).max(90).nullable().default(null),
      standSeconds: number2().int().min(0).max(86400).nullable().default(null),
      kneeAngle: number2().min(0).max(180).nullable().default(null),
      spasmPerDay: number2().int().min(0).max(200).nullable().default(null),
      systolic: number2().int().min(0).max(300).nullable().default(null),
      diastolic: number2().int().min(0).max(200).nullable().default(null),
      pulse: number2().int().min(0).max(250).nullable().default(null),
      spo2: number2().min(0).max(100).nullable().default(null),
      metStandard: boolean2().default(false),
      note: string2().max(2000).default("")
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.recordDate))
        throw new Error("Please pick a valid date.");
      const db = ctx.db();
      const inserted = await db.insert(standingRecords).values({
        weekLabel: args.weekLabel,
        recordDate: args.recordDate,
        bedAngle: args.bedAngle,
        standSeconds: args.standSeconds,
        kneeAngle: args.kneeAngle,
        spasmPerDay: args.spasmPerDay,
        systolic: args.systolic,
        diastolic: args.diastolic,
        pulse: args.pulse,
        spo2: args.spo2,
        metStandard: args.metStandard ? 1 : 0,
        note: args.note
      }).returning({ id: standingRecords.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  listStandingRecords: defineAction({
    description: "Lists saved weekly standing-progression monitoring records (Staff Entry team forms), newest first.",
    request: object({}),
    response: object({
      records: array(object({
        id: number2(),
        weekLabel: string2(),
        recordDate: string2(),
        bedAngle: number2().nullable(),
        standSeconds: number2().nullable(),
        kneeAngle: number2().nullable(),
        spasmPerDay: number2().nullable(),
        systolic: number2().nullable(),
        diastolic: number2().nullable(),
        pulse: number2().nullable(),
        spo2: number2().nullable(),
        metStandard: boolean2(),
        note: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(standingRecords).orderBy(desc(standingRecords.id)).limit(60);
      return {
        records: rows.map((r) => ({
          id: r.id,
          weekLabel: r.weekLabel,
          recordDate: r.recordDate,
          bedAngle: r.bedAngle,
          standSeconds: r.standSeconds,
          kneeAngle: r.kneeAngle,
          spasmPerDay: r.spasmPerDay,
          systolic: r.systolic,
          diastolic: r.diastolic,
          pulse: r.pulse,
          spo2: r.spo2,
          metStandard: r.metStandard === 1,
          note: r.note
        }))
      };
    }
  }),
  deleteStandingRecord: defineAction({
    description: "Deletes one standing-progression monitoring record (e.g. saved by mistake).",
    request: object({ id: number2().int().positive() }),
    response: object({ ok: literal(true) }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.delete(standingRecords).where(eq(standingRecords.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  saveNutritionPlan: defineAction({
    description: "Calculates and saves a daily nutrition target from a measured weight (Staff Entry team forms, nutrition calculation). Formulas: total energy = weight \xD7 energy factor; protein = weight \xD7 protein factor; fat = total \xD7 fat share \xF7 9; carbohydrate = total \xD7 carb share \xF7 4; protein energy = protein grams \xD7 4 kcal (the corrected formula \u2014 the source sheet's 6,820 kcal figure was an error). Returns the computed values.",
    request: object({
      patientId: string2().max(10).default(""),
      weightKg: number2().min(20).max(400),
      energyFactor: number2().min(10).max(60).default(27.5),
      proteinFactor: number2().min(0.5).max(3).default(1.35),
      fatPct: number2().min(0).max(100).default(25),
      carbPct: number2().min(0).max(100).default(55)
    }),
    response: object({
      ok: literal(true),
      id: number2(),
      totalKcal: number2(),
      proteinG: number2(),
      fatG: number2(),
      carbG: number2(),
      proteinKcal: number2()
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const totalKcal = Math.round(args.weightKg * args.energyFactor);
      const proteinG = Math.round(args.weightKg * args.proteinFactor);
      const fatG = Math.round(totalKcal * (args.fatPct / 100) / 9);
      const carbG = Math.round(totalKcal * (args.carbPct / 100) / 4);
      const proteinKcal = proteinG * 4;
      const inserted = await db.insert(nutritionPlans).values({
        patientId: args.patientId,
        weightKg: args.weightKg,
        energyFactor: args.energyFactor,
        proteinFactor: args.proteinFactor,
        fatPct: args.fatPct,
        carbPct: args.carbPct,
        totalKcal,
        proteinG,
        fatG,
        carbG,
        proteinKcal
      }).returning({ id: nutritionPlans.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, totalKcal, proteinG, fatG, carbG, proteinKcal };
    }
  }),
  listNutritionPlans: defineAction({
    description: "Lists saved nutrition calculations (Staff Entry team forms), newest first.",
    request: object({}),
    response: object({
      plans: array(object({
        id: number2(),
        patientId: string2(),
        weightKg: number2(),
        energyFactor: number2(),
        proteinFactor: number2(),
        fatPct: number2(),
        carbPct: number2(),
        totalKcal: number2(),
        proteinG: number2(),
        fatG: number2(),
        carbG: number2(),
        proteinKcal: number2(),
        createdAt: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(nutritionPlans).orderBy(desc(nutritionPlans.id)).limit(30);
      return {
        plans: rows.map((r) => ({
          id: r.id,
          patientId: r.patientId,
          weightKg: r.weightKg,
          energyFactor: r.energyFactor,
          proteinFactor: r.proteinFactor,
          fatPct: r.fatPct,
          carbPct: r.carbPct,
          totalKcal: r.totalKcal,
          proteinG: r.proteinG,
          fatG: r.fatG,
          carbG: r.carbG,
          proteinKcal: r.proteinKcal,
          createdAt: r.createdAt.toISOString()
        }))
      };
    }
  }),
  saveTeamForm: defineAction({
    description: "Saves a Staff Entry team form \u2014 the weekly tracking & follow-up record, or the Week-4 standing checkpoint verdict \u2014 into the shared staff-entries store, so it also appears in Recent entries. Payload fields are short strings, numbers or yes/no values.",
    request: object({
      patientId: string2().min(1).max(10),
      week: string2().min(1).max(40),
      formType: _enum(["followup", "week4"]),
      entryDate: string2().min(1).max(20),
      payload: record(string2().max(60), union([string2().max(2000), number2(), boolean2()]))
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const role = args.formType === "followup" ? "\u968F\u8BBF Follow-up" : "\u7B2C4\u5468\u68C0\u67E5\u70B9 Week-4 checkpoint";
      const inserted = await db.insert(staffEntries).values({
        patientId: args.patientId,
        week: args.week,
        role,
        entryDate: args.entryDate,
        payloadJson: JSON.stringify(args.payload)
      }).returning({ id: staffEntries.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  listTeamForms: defineAction({
    description: "Lists saved Staff Entry team forms (weekly tracking & follow-up records and Week-4 checkpoint verdicts) with their filled-in fields, newest first.",
    request: object({}),
    response: object({
      forms: array(object({
        id: number2(),
        patientId: string2(),
        week: string2(),
        formType: _enum(["followup", "week4"]),
        entryDate: string2(),
        payload: record(string2(), union([string2(), number2(), boolean2()]))
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(staffEntries).orderBy(desc(staffEntries.id)).limit(200);
      const forms = [];
      for (const r of rows) {
        const formType = r.role === "\u968F\u8BBF Follow-up" ? "followup" : r.role === "\u7B2C4\u5468\u68C0\u67E5\u70B9 Week-4 checkpoint" ? "week4" : null;
        if (!formType)
          continue;
        let payload = {};
        try {
          payload = JSON.parse(r.payloadJson);
        } catch {
          payload = {};
        }
        forms.push({ id: r.id, patientId: r.patientId, week: r.week, formType, entryDate: r.entryDate, payload });
        if (forms.length >= 30)
          break;
      }
      return { forms };
    }
  }),
  savePricingSelection: defineAction({
    description: "Saves a client's pricing choices from the Staff entry \u2192 Pricing sub-tab: one package plus any add-on services picked from the decided price list, so the team can see what each client chose.",
    request: object({
      clientName: string2().trim().max(60),
      packageLabel: string2().trim().max(120),
      packagePrice: string2().trim().max(60),
      services: array(object({
        label: string2().trim().min(1).max(120),
        price: string2().trim().max(60)
      })).max(40),
      note: string2().trim().max(500)
    }),
    response: object({ ok: literal(true), id: number2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const inserted = await db.insert(pricingSelections).values({
        clientName: args.clientName,
        packageLabel: args.packageLabel,
        packagePrice: args.packagePrice,
        servicesJson: JSON.stringify(args.services),
        note: args.note
      }).returning({ id: pricingSelections.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  listPricingSelections: defineAction({
    description: "Lists saved client pricing selections from the Staff entry \u2192 Pricing sub-tab, newest first.",
    request: object({}),
    response: object({
      selections: array(object({
        id: number2(),
        clientName: string2(),
        packageLabel: string2(),
        packagePrice: string2(),
        services: array(object({ label: string2(), price: string2() })),
        note: string2(),
        createdAt: string2()
      }))
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(pricingSelections).orderBy(desc(pricingSelections.id)).limit(50);
      return {
        selections: rows.map((r) => {
          let services = [];
          try {
            const parsed = JSON.parse(r.servicesJson);
            if (Array.isArray(parsed)) {
              services = parsed.filter((s) => typeof s === "object" && s !== null && typeof s.label === "string" && typeof s.price === "string");
            }
          } catch {
            services = [];
          }
          return { id: r.id, clientName: r.clientName, packageLabel: r.packageLabel, packagePrice: r.packagePrice, services, note: r.note, createdAt: r.createdAt.toISOString() };
        })
      };
    }
  })
};
export {
  Actions
};
