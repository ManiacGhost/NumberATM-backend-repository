// function getMobileNumberCategory(number) {
//   const str = number.toString();

const VIPNumber = require("../models/vipNumber");

//   if (!/^\d{10}$/.test(str)) return "Invalid number";

//   // Numerology Without 2 4 8
//   if (!str.includes('2') && !str.includes('4') && !str.includes('8')) {
//     return "Numerology Without 2 4 8";
//   }
//   // SEPTA: 9XY AAA AAA A
//   if (/^9\d\d(\d)\1{3}(\d)\2{2}$/.test(str)) return "SEPTA (9XY AAA AAA A)";

//   // OCTA NUMBERS: 8 repeated digits
//   if (/(\d)\1{7}/.test(str)) return "OCTA NUMBERS";
//   if (/(\d)\1{5}/.test(str)) return "HEXA NUMBER";
//   // PENTA NUMBERS: 5 repeated digits
//   if (/(\d)\1{4}/.test(str)) return "PENTA NUMBERS";
//   // ENDING AAAA
//   if (/(\d)\1{3}$/.test(str)) return "ENDING AAAA NUMBERS";

//   // AB AB (e.g., XXXXXX1212)
//   if (/(\d)(\d)\1\2$/.test(str)) return "AB AB (XXXXXX 1212)";

//   // ABC ABC NUMBERS
//   if (/(\d)(\d)(\d)\1\2\3$/.test(str)) return "ABC ABC NUMBERS";

//   // MIRROR NUMBERS
//   if (str === str.split('').reverse().join('')) return "MIRROR NUMBERS";

//   // SEMI MIRROR NUMBERS
//   if (str.slice(0, 5) === str.slice(5).split('').reverse().join('')) {
//     return "SEMI MIRROR NUMBERS";
//   }

//   // 123456 NUMBERS
//   if (str.includes("123456")) return "123456 NUMBERS";

//   // 786 NUMBERS
//   if (str.includes("786")) return "786 NUMBERS";

//   // 11 12 13 NUMBERS
//   if (str.includes("11") && str.includes("12") && str.includes("13")) {
//     return "11 12 13 NUMBERS";
//   }

//   // UNIQUE NUMBERS: All digits unique
//   if (new Set(str).size === 10) return "UNIQUE NUMBERS";

//   // AAA BBB
//   if (/(\d)\1\1(\d)\2\2/.test(str)) return "AAA BBB";

//   // XY XY XY
//   if (/(\d)(\d)\1\2\1\2$/.test(str)) return "XY XY XY NUMBERS";

//   // DOUBLING NUMBERS: First half = second half
//   if (str.slice(0, 5) === str.slice(5)) return "DOUBLING NUMBERS";

//   // ENDING AAA
//   if (/(\d)\1\1$/.test(str)) return "ENDING AAA NUMBERS";

//   // AB XYXYXYXY
//   if (/^\d{2}(\d\d)\1\1\1$/.test(str)) return "AB XYXYXYXY";

//   // ABCD ABCD
//   if (/(\d)(\d)(\d)(\d)\1\2\3\4$/.test(str)) return "ABCD ABCD NUMBERS";

//   // abc abc abc
//   if (/(\d{3})\1\1/.test(str)) return "abc abc abc";

//   // AAAA BBBB
//   if (/(\d)\1{3}(\d)\2{3}/.test(str)) return "AAAA BBBB NUMBERS";

//   // 3 DIGITS: Same digit repeated 3 times anywhere
//   if (/(\d)\1\1/.test(str)) return "3 DIGITS NUMBER";

//   // AB AB XY XY
//   if (/(\d)(\d)\1\2(\d)(\d)\3\4$/.test(str)) return "AB AB XY XY";

//   // AAA XY AAA
//   if (/(\d)\1\1\d\d\1\1\1$/.test(str)) return "AAA XY AAA";

//   // AOOB COOD / ABOO CDOO / OOOAB
//   if (/^(\d)\1\1\d{2}$/.test(str) || /\d{2}(\d)\1\1$/.test(str)) {
//     return "AOOB COOD / ABOO CDOO / OOOAB";
//   }

//   // AAAA middle (e.g., XXXAAAAXXX)
//   if (/^\d{3}(\d)\1{3}\d{3}$/.test(str)) return "AAAA middle";

//   // AO BO CO DO EO
//   if (/(\d)0(\d)0(\d)0/.test(str)) return "AO BO CO DO EO";

//   // AAA Middle
//   if (/^\d{3}(\d)\1\1\d{4}$/.test(str)) return "AAA Middle";

//   // Start & Middle PENTA
//   if (/^(\d)\1{4}\d{1,2}(\d)\2{4}/.test(str)) return "Start & Middle PENTA";

//   // AOO BOO COO
//   if (/(\d)00(\d)00(\d)00/.test(str)) return "AOO BOO / AOO BOO COO";

//   // START A OOO B END A OOO B
//   if (/^(\d)000\d.*\1{1}000\d$/.test(str)) return "START A OOO B END A OOO B";

//   // AAAA XY AAAA
//   if (/(\d)\1{3}\d\d(\d)\3{3}/.test(str)) return "AAAA XY AAAA";

//   return "Random Numbers";
// }
// function hasCategory(number, category) {
//   const str = number.toString();
//   if (!/^\d{10}$/.test(str)) return false;

//   const checks = {
//     "Numerology Without 2 4 8": () => !str.includes('2') && !str.includes('4') && !str.includes('8'),
//     "SEPTA (9XY AAA AAA A)": () => /^9\d\d(\d)\1{3}(\d)\2{2}$/.test(str),
//     "OCTA NUMBERS": () => /(\d)\1{7}/.test(str),
//     "HEXA NUMBER": () => /(\d)\1{5}/.test(str),
//     "PENTA NUMBERS": () => /(\d)\1{4}/.test(str),
//     "ENDING AAAA NUMBERS": () => /(\d)\1{3}$/.test(str),
//     "AB AB (XXXXXX 1212)": () => /(\d)(\d)\1\2$/.test(str),
//     "ABC ABC NUMBERS": () => /(\d)(\d)(\d)\1\2\3$/.test(str),
//     "MIRROR NUMBERS": () => str === str.split('').reverse().join(''),
//     "SEMI MIRROR NUMBERS": () => str.slice(0, 5) === str.slice(5).split('').reverse().join(''),
//     "123456 NUMBERS": () => str.includes("123456"),
//     "786 NUMBERS": () => str.includes("786"),
//     "11 12 13 NUMBERS": () => str.includes("11") && str.includes("12") && str.includes("13"),
//     "UNIQUE NUMBERS": () => new Set(str).size === 10,
//     "AAA BBB": () => /(\d)\1\1(\d)\2\2/.test(str),
//     "XY XY XY NUMBERS": () => /(\d)(\d)\1\2\1\2$/.test(str),
//     "DOUBLING NUMBERS": () => str.slice(0, 5) === str.slice(5),
//     "ENDING AAA NUMBERS": () => /(\d)\1\1$/.test(str),
//     "AB XYXYXYXY": () => /^\d{2}(\d\d)\1\1\1$/.test(str),
//     "ABCD ABCD NUMBERS": () => /(\d)(\d)(\d)(\d)\1\2\3\4$/.test(str),
//     "abc abc abc": () => /(\d{3})\1\1/.test(str),
//     "AAAA BBBB NUMBERS": () => /(\d)\1{3}(\d)\2{3}/.test(str),
//     "3 DIGITS NUMBER": () => /(\d)\1\1/.test(str),
//     "AB AB XY XY": () => /(\d)(\d)\1\2(\d)(\d)\3\4$/.test(str),
//     "AAA XY AAA": () => /(\d)\1\1\d\d\1\1\1$/.test(str),
//     "AOOB COOD / ABOO CDOO / OOOAB": () => /^(\d)\1\1\d{2}$/.test(str) || /\d{2}(\d)\1\1$/.test(str),
//     "AAAA middle": () => /^\d{3}(\d)\1{3}\d{3}$/.test(str),
//     "AO BO CO DO EO": () => /(\d)0(\d)0(\d)0/.test(str),
//     "AAA Middle": () => /^\d{3}(\d)\1\1\d{4}$/.test(str),
//     "Start & Middle PENTA": () => /^(\d)\1{4}\d{1,2}(\d)\2{4}/.test(str),
//     "AOO BOO / AOO BOO COO": () => /(\d)00(\d)00(\d)00/.test(str),
//     "START A OOO B END A OOO B": () => /^(\d)000\d.*\1{1}000\d$/.test(str),
//     "AAAA XY AAAA": () => /(\d)\1{3}\d\d(\d)\2{3}/.test(str),
//   };

//   const check = checks[category];
//   return check ? check() : false;
// }
function getMobileNumberCategory(number) {
  const str = number.toString();
  const categories = [];

  if (!/^\d{10}$/.test(str)) return ["Invalid number"];

  if (!str.includes('2') && !str.includes('4') && !str.includes('8')) {
    categories.push("Numerology Without 2 4 8");
  }
  if (/^9\d\d(\d)\1{3}(\d)\2{2}$/.test(str)) categories.push("SEPTA (9XY AAA AAA A)");
  if (/(\d)\1{7}/.test(str)) categories.push("OCTA NUMBERS");
  if (/(\d)\1{5}/.test(str)) categories.push("HEXA NUMBER");
  if (/(\d)\1{4}/.test(str)) categories.push("PENTA NUMBERS");
  if (/(\d)\1{3}$/.test(str)) categories.push("ENDING AAAA NUMBERS");
  if (/(\d)(\d)\1\2$/.test(str)) categories.push("AB AB (XXXXXX 1212)");
  if (/(\d)(\d)(\d)\1\2\3$/.test(str)) categories.push("ABC ABC NUMBERS");
  if (str === str.split('').reverse().join('')) categories.push("MIRROR NUMBERS");
  if (str.slice(0, 5) === str.slice(5).split('').reverse().join('')) categories.push("SEMI MIRROR NUMBERS");
  if (str.includes("123456")) categories.push("123456 NUMBERS");
  if (str.includes("786")) categories.push("786 NUMBERS");
  if (str.includes("11") && str.includes("12") && str.includes("13")) categories.push("11 12 13 NUMBERS");
  if (new Set(str).size === 10) categories.push("UNIQUE NUMBERS");
  if (/(\d)\1\1(\d)\2\2/.test(str)) categories.push("AAA BBB");
  if (/(\d)(\d)\1\2\1\2$/.test(str)) categories.push("XY XY XY NUMBERS");
  if (str.slice(0, 5) === str.slice(5)) categories.push("DOUBLING NUMBERS");
  if (/(\d)\1\1$/.test(str)) categories.push("ENDING AAA NUMBERS");
  if (/^\d{2}(\d\d)\1\1\1$/.test(str)) categories.push("AB XYXYXYXY");
  if (/(\d)(\d)(\d)(\d)\1\2\3\4$/.test(str)) categories.push("ABCD ABCD NUMBERS");
  if (/(\d{3})\1\1/.test(str)) categories.push("abc abc abc");
  if (/(\d)\1{3}(\d)\2{3}/.test(str)) categories.push("AAAA BBBB NUMBERS");
  if (/(\d)\1\1/.test(str)) categories.push("3 DIGITS NUMBER");
  if (/(\d)(\d)\1\2(\d)(\d)\3\4$/.test(str)) categories.push("AB AB XY XY");
  if (/(\d)\1\1\d\d\1\1\1$/.test(str)) categories.push("AAA XY AAA");
  if (/^(\d)\1\1\d{2}$/.test(str) || /\d{2}(\d)\1\1$/.test(str)) categories.push("AOOB COOD / ABOO CDOO / OOOAB");
  if (/^\d{3}(\d)\1{3}\d{3}$/.test(str)) categories.push("AAAA middle");
  if (/(\d)0(\d)0(\d)0/.test(str)) categories.push("AO BO CO DO EO");
  if (/^\d{3}(\d)\1\1\d{4}$/.test(str)) categories.push("AAA Middle");
  if (/^(\d)\1{4}\d{1,2}(\d)\2{4}/.test(str)) categories.push("Start & Middle PENTA");
  if (/(\d)00(\d)00(\d)00/.test(str)) categories.push("AOO BOO / AOO BOO COO");
  if (/^(\d)000\d.*\1{1}000\d$/.test(str)) categories.push("START A OOO B END A OOO B");
  if (/(\d)\1{3}\d\d(\d)\3{3}/.test(str)) categories.push("AAAA XY AAAA");

  return categories.length ? categories : ["Random Numbers"];
}
const setNumerology = async () => {
  try {
    {
      const vipNumbers = await VIPNumber.find({
      category: { $in: ["Numberology Without 2 4 8"] }
    });

    for (const vip of vipNumbers) {
      vip.category = vip.category.map(cat =>
        cat === "Numberology Without 2 4 8" ? "Numerology Without 2 4 8" : cat
      );
      await vip.save();
    }

    console.log(`Updated ${vipNumbers.length} documents`);
    }
  } catch (e) {
    console.log(e)
  }
}
// setNumerology();
module.exports = { getMobileNumberCategory }