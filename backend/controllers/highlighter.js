// // highlightMobileNumber.js
// function highlightMobileNumber(numberString) {
//     const num = numberString.replace(/\s+/g, "").trim();
//     if (num.length !== 10) {
//       return `<span class="text-red-500">${numberString}</span>`;
//     }

//     const patterns = [
//       // Repeating digits: Deca to Penta
//       { regex: /(\d)\1{9}/, className: "text-orange-500  font-bold", label: "Deca" },
//       { regex: /(\d)\1{8}/, className: "text-orange-500  font-bold", label: "Nona" },
//       { regex: /(\d)\1{7}/, className: "text-orange-500  font-bold", label: "Octa" },
//       { regex: /(\d)\1{6}/, className: "text-orange-500  font-bold", label: "Hepta" },
//       { regex: /(\d)\1{5}/, className: "text-orange-500  font-bold", label: "Hexa" },
//       { regex: /(\d)\1{4}/, className: "text-orange-500  font-bold", label: "Penta" },

//       // Repeating sequences
//       { regex: /(\d{5})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
//       { regex: /(\d{4})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
//       { regex: /(\d{3})\1{2,}/, className: "text-orange-500 font-bold", format: "$1 $1 $1" },
//       { regex: /(\d{3})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
//       { regex: /(\d{2})\1{3,}/, className: "text-orange-500 font-bold", format: "$1 $1 $1 $1" },
//       { regex: /(\d{2})\1{2,}/, className: "text-orange-500 font-bold", format: "$1 $1 $1" },
//       { regex: /(\d{2})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },

//       // Palindrome-like pattern
//       { regex: /(\d)(\d)\2\1/, className: "text-pink-500 font-bold" },
//     ];

//     for (let { regex, className, format } of patterns) {
//       const match = num.match(regex);
//       if (match) {
//         const highlightedText = format ? match[0].replace(regex, format) : match[0];
//         const start = match.index;
//         const end = start + match[0].length;

//         return (
//           num.slice(0, start) +
//           `<span class="${className}"> ${highlightedText} </span>` +
//           num.slice(end)
//         );
//       }
//     }

//     // If no match found: apply random highlight
//     const randomIndex = Math.floor(Math.random() * 6);
//     const randomLength = Math.floor(Math.random() * 3) + 3;

//     return (
//       num.slice(0, randomIndex) +
//       `<span class="text-orange-500 font-bold"> ${num.slice(randomIndex, randomIndex + randomLength)} </span>` +
//       num.slice(randomIndex + randomLength)
//     );
//   }
function highlightDigitGroups(input, targetDigit) {
  const regex = new RegExp(`${targetDigit}+`, 'g'); // Create dynamic regex for targetDigit
  let result = '';
  let lastIndex = 0;

  const matches = [...input.matchAll(regex)];

  for (const match of matches) {
    const start = match.index;
    const matched = match[0];
    const length = matched.length;

    // Append text before the match
    result += input.slice(lastIndex, start);

    // Highlight based on length
    if (length >= 5) {
      result += `<span class="text-orange-500 font-bold mx-1">${matched}</span>`; // Penta+
    } else if (length >= 2) {
      result += `<span class="text-orange-500 font-bold mx-1">${matched}</span>`; // Group (2 or more)
    } else if (length === 1) {
      result += `<span class="text-orange-500 font-bold mx-1">${matched}</span>`; // Single (if standalone)
    } else {
      result += matched; // No highlight for other digits
    }

    lastIndex = start + length;
  }

  // Add remaining part after the last match
  result += input.slice(lastIndex);
  return result;
}
function highlightMobileNumber(numberString) {
  const numRaw = numberString.trim();
  const num = numRaw.replace(/\s+/g, "");
  if (num.length !== 10) {
    return `<span class="text-red-500">${numberString}</span>`;
  }

  const patterns = [
    { regex: /(123456)/, className: "text-orange-500 font-bold", },
    { regex: /(11\s?12\s?13)/, className: "text-orange-500 font-bold", format: "$1 $1 $1" },
    { regex: /(12345)/, className: "text-orange-500 font-bold",format: "$1 $1 $1" },
    // Repeating digits: Deca to Penta
    { regex: /(\d)\1{9}/, className: "text-orange-500 font-bold", label: "Deca" },
    { regex: /(\d)\1{8}/, className: "text-orange-500 font-bold", label: "Nona" },
    { regex: /(\d)\1{7}/, className: "text-orange-500  font-bold", label: "Octa" },
    { regex: /(\d)\1{6}/, className: "text-orange-500  font-bold", label: "Hepta" },
    { regex: /(\d)\1{5}/, className: "text-orange-500 font-bold", label: "Hexa" },
    { regex: /(\d)\1{4}/, className: "text-orange-500 font-bold", label: "Penta" },
    { regex: /(\d)\1{3}/, className: "text-orange-500 font-bold", label: "Penta" },
    { regex: /(\d)\1{2}/, className: "text-orange-500 font-bold", label: "Penta" },

    // // Flexible three-time repeating sequences anywhere
    // { regex: /(\d{2}).*?(\1)/g, className: "text-orange-500 font-bold", format:"$1 $1" },

    { regex: /(\d{3}).*?(\d{3}).*?\1.*?\2/, className: "text-orange-500 font-bold", format: "$1 $2 $1 $2" }, // e.g., 123 456 123 456
    { regex: /(\d{5})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
    { regex: /(\d{4})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
    { regex: /(\d{3})\1{2,}/, className: "text-orange-500 font-bold", format: "$1 $1 $1" },
    { regex: /(\d{3})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
    { regex: /(\d{2})\1{3,}/, className: "text-orange-500 font-bold", format: "$1 $1 $1 $1" },
    { regex: /(\d{2})\1{2,}/, className: "text-orange-500 font-bold", format: "$1 $1 $1" },
    { regex: /(\d{2})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
    { regex: /(\d{2}).*?(\d{2}).*?\1.*?\2/, className: "text-orange-500 font-bold", format: "$1 $2 $1 $2" }, // e.g., 90 8943 90 90
    { regex: /(\d{2}).*?\1/, className: "text-orange-500 font-bold", format: "$1 $2 $1 $2" }, // e.g., 90 8943 90 90
    { regex: /(\d{2}).*?(\d{2}).*?(\d{2}).*?\1.*?\2.*?\3/, className: "text-orange-500 font-bold", format: "$1 $2 $3 $1 $2 $3" },
    // Allow random repeating digits or sequences for fallback highlighting
    { regex: /(\d{3})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
    { regex: /(\d{4})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },
    { regex: /(\d{5})\1/, className: "text-orange-500 font-bold", format: "$1 $1" },

    { regex: /(?=012)|(?=123)|(?=234)|(?=345)|(?=456)|(?=567)|(?=678)|(?=789)/, className: "text-orange-500 font-bold", },

  ];

  for (let { regex, className, label } of patterns) {
    const match = num.match(regex);
    if (match && match?.[0]!=='') {
      const groupsToHighlight = [...new Set(match.slice(1).filter(Boolean))]; // unique captured groups
      // console.log(match, label)
      // Build highlighting regex from detected patterns
      const highlightRegex = new RegExp(`(${groupsToHighlight.join("|")})`, "g");

      // Rebuild by iterating over the raw input (with spaces)
      const tokens = numRaw.split(/(\d+)/).map((part) => {
        if (/^\d+$/.test(part)) {
          if (label) {
            return highlightDigitGroups(numberString, match[1])
          }
          // Number part – highlight matches inside it
          else return part.replace(highlightRegex, `<span class="${label ? className : className + ' mx-1'}">$1</span>`);
        }
        return part; // keep spaces or non-digit characters as-is
      });

      return tokens.join("");
    }
  }

  // fallback
  const clean = numRaw.replace(/\s+/g, "");
  const randomIndex = Math.floor(Math.random() * 6);
  const randomLength = Math.floor(Math.random() * 3) + 3;
  const highlightedPart = clean.slice(randomIndex, randomIndex + randomLength);

  const highlightRegex = new RegExp(`(${highlightedPart})`, "g");

  const fallback = numRaw.split(/(\d+)/).map((part) => {
    if (/^\d+$/.test(part)) {
      return part.replace(highlightRegex, `<span class="text-orange-500 mx-1 font-bold">$1</span>`);
    }
    return part;
  });

  return fallback.join("");
}

// // module.exports = highlightMobileNumber;

// console.log(highlightMobileNumber('9793567894'))
// console.log(highlightMobileNumber('9936679936'))
// console.log(highlightMobileNumber('9089439090'))
// console.log(highlightMobileNumber('9376037366'))
// console.log(highlightMobileNumber('9999979968'))
// console.log(highlightMobileNumber('6394394394'));
// console.log(highlightMobileNumber('6943694694'));
// console.log(highlightMobileNumber('9559973366'));
// console.log(highlightMobileNumber('7897999499'));
// console.log(highlightMobileNumber('7607080090'));
// console.log(highlightMobileNumber('7880588488'));
// console.log(highlightMobileNumber('7300940049'));
// console.log(highlightMobileNumber('9780077733'));
// console.log(highlightMobileNumber('7897888688'));
// console.log(highlightMobileNumber('7881188688'));
// console.log(highlightMobileNumber('7318123454'));

module.exports = highlightMobileNumber;

// module.exports = highlightMobileNumber;