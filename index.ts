// const obj = {
//   a: 1,
//   b: 'B',
//   c: true,
//   d: null,
//   e: undefined,
//   f: {
//     g: 2,
//     h: 'H',
//   },
//   i: [3, 'I', false, '\u{1F4A9}', null, undefined],
// };

const obj = ["true", "arr", '"[']

const jsonStr = JSON.stringify(obj, null, 2);
console.log(jsonStr);
console.log(JSON.parse(jsonStr));
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type ParserResult = {
  json: string,
  value: Json,
} | never ;

const trimHeadSpace = (str: string, comma: boolean): string => {
  return str.replace(comma ? /^([\s,]+)/ : /^(\s+)/, '');
};
/\[(?=(?:(?:(?:[^"]!\\")*+"){2})*+[^"]*+\z) /
const objectParser = (json: string): ParserResult => {

  return { json, value: {} };
}
const arrayParser = (json: string): ParserResult => {
  let array = trimHeadSpace(json, true);
  let result: Json[] = [];
  if (array.charAt(0) === '[') {
    array = array.slice(1);
    while (array.charAt(0) !== ']') {
      try {
        const { json, value } = parseJSONString(array);
        result.push(value);
        array = trimHeadSpace(json, true);
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
}
const stringParser = (json: string): ParserResult => {
  let string = trimHeadSpace(json, true);
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
    } else {
      if (char === '\\') {
        escape = true;
        i += 1;
      } else if (char === '"') {
        return {
          json: string.slice(i + 1),
          value: result,
        };
      } else {
        result += char;
        i += 1;
      }
    }
  }
  throw new Error('Invalid JSON string');
}
const numberParser = (json: string): ParserResult => {
  const [number] = (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(json)) || [];
  
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
}
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
}
const nullParser = (json: string): ParserResult => {
  if (json.startsWith('null')) {
    return {
      json: json.slice(4),
      value: null,
    };
  }
  throw new Error('No matching string');
}

const parseJSONString = (json: string): ParserResult | never => {
  console.log(json);
  let string = trimHeadSpace(json, true);
  

  if (json.startsWith('"')) {
    try {
      return stringParser(json);
    } catch (e) {
      throw new Error('Invalid JSON string: ' + e);
    }
  }
  if (json.startsWith('{')) {
    try {
      return objectParser(json);
    } catch (e) {
      throw new Error('Invalid JSON object: ' + e);
    }
  }
  if (json.startsWith('[')) {
    try {
      return arrayParser(json);
    } catch (e) {
      throw new Error('Invalid JSON array: ' + e);
    }
  }
  if (json.startsWith('true') || json.startsWith('false')) {
    try {
      return booleanParser(json);
    } catch (e) {
      throw new Error('Invalid JSON boolean: ' + e);
    }
  }
  if (json.startsWith('null')) {
    try {
      return nullParser(json);
    } catch (e) {
      throw new Error('Invalid JSON null: ' + e);
    }
  }
  if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, '-'].includes(json.charCodeAt(0))) {
    try {
      return numberParser(json);
    } catch (e) {
      throw new Error('Invalid JSON number: ' + e);
    }
  }

  throw new Error('Invalid JSON string');
};




const parsed = parseJSONString(jsonStr);
console.log(parsed);
