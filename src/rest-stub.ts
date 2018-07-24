import axios from 'axios';
import { getMethodNames } from './reflect';

let baseUrl: string;

/* example: http://127.0.0.1:3000 */
export function setBaseUrl (s: string) {
  baseUrl = s;
}

const stub_path = new Map<any, string>();
const stub_methodName_restPath = new Map<any, Map<string, [string, string]>>();

function set_map2<K1, K2, V> (
  mapMap: Map<K1, Map<K2, V>>,
  key1: K1,
  key2: K2,
  value: V,
) {
  if (!mapMap.has(key1)) {
    mapMap.set(key1, new Map<K2, V>());
  }
  const map = mapMap.get(key1);
  map.set(key2, value);
}

/*
function set_map3<K1, K2, K3, V> (mapMapMap: Map<K1, Map<K2, Map<K3, V>>>, key1: K1, key2: K2, key3: K3, value: V) {
  if (!mapMapMap.has(key1)) {
    mapMapMap.set(key1, new Map<K2, Map<K3, V>>());
  }
  const mapMap = mapMapMap.get(key1);
  set_map2(mapMap, key2, key3, value);
}
*/

export function Route (path: string) {
  return function (stub) {
    stub_path.set(stub, path);
  };
}

function rest (restMethod: string) {
  return function method (path: string) {
    return function (stub, methodName) {
      set_map2(stub_methodName_restPath, stub, methodName, [restMethod, path]);
    };
  };
}

export const Post = rest('POST');
export const Get = rest('GET');

function get_methodName (o, method): string {
  for (const methodName of getMethodNames(o)) {
    if (o[methodName] === method) {
      return methodName;
    }
  }
}

interface RestCall {
  method: string;
  path: string;
}

function resolvePath<Stub> (
  stub: Stub,
  methodName: string & keyof Stub,
): RestCall {
  const root = stub_path.get(stub.constructor);
  // console.debug({root, stub_method_restPath: stub_methodName_restPath, methodName});
  // debugger;
  const [restMethod, path] = stub_methodName_restPath
    .get(stub.constructor.prototype)
    .get(methodName);
  // console.debug({root, restMethod, path});
  // debugger;
  return {
    method: restMethod,
    path: `${root}${path}`,
  };
}

export function passToStub<A> (
  handler: { stub: any },
  method,
  data,
): Promise<A> {
  const stub = handler.stub;
  const methodName = get_methodName(handler, method);
  const restCall = resolvePath(stub, methodName);

  function call (url) {
    switch (restCall.method) {
      case 'GET':
        // TODO replace url from data
        Object.keys(data).forEach((x) => (url = url.replace(':' + x, data[x])));
        return axios.get<A>(url);
      case 'POST':
        return axios.post<A>(url, data);
      default:
        throw new Error('unsupported rest method: ' + restCall.method);
    }
  }

  if (baseUrl === undefined || baseUrl === null) {
    throw new Error('baseUrl is not configured');
  }
  return call(`${baseUrl}/${restCall.path}`).then((res) => res.data);
}
