type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type ParserResult =
  | {
      json: string;
      value: Json;
    }
  | never;

const trimHead = (str: string, comma?: boolean): string => {
  return str.replace(comma ? /^([\s,]+)/ : /^(\s+)/, '');
};

const arrayParser = (json: string): ParserResult => {
  let array = trimHead(json, true);
  let result: Json[] = [];
  if (array.charAt(0) === '[') {
    array = array.slice(1);
    while (array.charAt(0) !== ']') {
      try {
        const { json, value } = parseJSONString(array);
        result.push(value);
        array = trimHead(json, true);
      } catch (e) {
        throw new Error(e);
      }
      if (array.charAt(0) === ',') {
        array = array.slice(1);
      }
    }
    return {
      json: array.slice(1),
      value: result,
    };
  }
  throw new Error('Invalid JSON array');
};
const stringParser = (json: string): ParserResult => {
  let string = trimHead(json, true);

  let result = '';
  let escape = false;
  let i = 1;
  while (i < string.length) {
    const char = string.charAt(i);
    if (escape) {
      if (char === 'u') {
        const unicode = string.slice(i + 1, i + 5);
        if (/^[0-9a-f]{4}$/i.test(unicode)) {
          result += String.fromCharCode(parseInt(unicode, 16));
          i += 5;
        } else {
          throw new Error('Invalid unicode escape sequence');
        }
      } else {
        switch (char) {
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case '"':
            result += '"';
            break;
          case '\\':
            result += '\\';
            break;
          default:
            throw new Error('Invalid escape sequence');
        }
        i += 1;
      }
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      i += 1;
      continue;
    }
    if (char === '"') {
      return {
        json: string.slice(i + 1),
        value: result,
      };
    }

    result += char;
    i += 1;
  }

  throw new Error('Invalid JSON strings');
};
const numberParser = (json: string): ParserResult => {
  const [number] = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(json) || [];

  if (Number.isNaN(Number(number))) {
    throw new Error('Invalid number');
  }
  if (number) {
    return {
      json: json.slice(number.length),
      value: Number(number),
    };
  }
  throw new Error('No matching string');
};
const booleanParser = (json: string): ParserResult => {
  if (json.startsWith('true')) {
    return {
      json: json.slice(4),
      value: true,
    };
  }
  if (json.startsWith('false')) {
    return {
      json: json.slice(5),
      value: false,
    };
  }
  throw new Error('No matching string');
};
const nullParser = (json: string): ParserResult => {
  if (json.startsWith('null')) {
    return {
      json: json.slice(4),
      value: null,
    };
  }
  throw new Error('No matching string');
};

const objectParser = (json: string): ParserResult => {
  let object = trimHead(json, true);
  object = trimHead(object, false);
  if (object.charAt(0) !== '{') {
    throw new Error('Invalid JSON Object');
  }
  object = object.slice(1);
  const result: { [key: string]: Json } = {};
  while (object.charAt(0) !== '}') {
    const key = stringParser(object);
    const keyName = String(key.value);
    object = trimHead(key.json);
    
    if (object.charAt(0) !== ':') {
      throw new Error('Invalid JSON Object');
    }
    object = object.slice(1);
    const value = parseJSONString(object);
    result[keyName] = value.value;

    object = trimHead(value.json, true);
  }
  object = object.slice(1);
  return { json: object, value: result };
};

const parseJSONString = (json: string): ParserResult | never => {
  let string = trimHead(json, true);

  if (string.startsWith('"')) {
    try {
      return stringParser(string);
    } catch (e) {
      throw new Error('Invalid JSON string: ' + e);
    }
  }
  if (string.startsWith('{')) {
    try {
      return objectParser(string);
    } catch (e) {
      throw new Error('Invalid JSON object: ' + e);
    }
  }
  if (string.startsWith('[')) {
    try {
      return arrayParser(string);
    } catch (e) {
      throw new Error('Invalid JSON array: ' + e);
    }
  }
  if (string.startsWith('true') || string.startsWith('false')) {
    try {
      return booleanParser(string);
    } catch (e) {
      throw new Error('Invalid JSON boolean: ' + e);
    }
  }
  if (string.startsWith('null')) {
    try {
      return nullParser(string);
    } catch (e) {
      throw new Error('Invalid JSON null: ' + e);
    }
  }
  if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, '-'].some((char) => string.startsWith(String(char)))) {
    try {
      return numberParser(string);
    } catch (e) {
      throw new Error('Invalid JSON number: ' + e);
    }
  }

  throw new Error('Invalid JSON string');
};
