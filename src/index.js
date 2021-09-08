import "./index.scss";

var $global = $global || {};
/***************************************************************
 * * Resize handler
 ***************************************************************/
//#region
function resetREM() {
  const viewWidth = document.documentElement.clientWidth || document.body.clientWidth;
  let gridCount = 10;
  if (viewWidth > 478) {
    gridCount = 15;
  }
  if (viewWidth > 638) {
    gridCount = 20;
  }
  // set rem.
  let rootSize;
  if (viewWidth > 718) {
    rootSize = 32;
  } else {
    rootSize = viewWidth / gridCount;
  }
  document.getElementsByTagName("html")[0].style.fontSize = rootSize + "px";
  document.getElementsByTagName("body")[0].style.fontSize = ".5rem";
}
document.addEventListener("DOMContentLoaded", function () {
  // resize processor
  (function () {
    resetREM();
    window.addEventListener("resize", resetREM);
  })();
});
//#endregion

/***************************************************************
 * * Common UI Events
 ***************************************************************/
//#region
function handleTabItemClick(event) {
  var target = event.currentTarget;
  var tabwrap = document.querySelector("ul.tab-container");
  var tabitems = tabwrap.querySelectorAll(".tab-item");
  if (tabitems) {
    tabitems.forEach((x) => x.classList.remove("activated"));
  }
  target.classList.add("activated");
  var label = target.getAttribute("data-label");
  switchScenario(label);
}
function bindTabFunctions() {
  let tabwrap = document.querySelector("ul.tab-container");
  if (tabwrap) {
    tabwrap.querySelectorAll(".tab-item").forEach((x) => {
      //console.log(x);
      x.removeEventListener("click", handleTabItemClick);
      x.addEventListener("click", handleTabItemClick);
    });
  }
}
function switchScenario(label) {
  var identifyLabel = label.toLowerCase();
  var functionPanel = document.querySelector("#app .function-panel");
  [...functionPanel.children].forEach((x) => x.classList.remove("activated"));
  switch (identifyLabel) {
    default:
      break;
    case "resolve":
      functionPanel.querySelector("section.resolve").classList.add("activated");
      break;
    case "maker":
      functionPanel.querySelector("section.maker").classList.add("activated");
      break;
  }
}

//#endregion

/***************************************************************
 * * Input box events
 ***************************************************************/
//#region
function handleSecretInputChanges(event) {
  let $input = document.getElementById("hex-secret");
  let originText = $input.getAttribute("data-prev");
  if (!originText) {
    originText = "";
  }
  let cursorPos = $input.selectionStart;
  let newText = "";
  if ($input) {
    //console.log("current cursor position: ", cursorPos);
    //console.log("input value: ", originText);
  }

  if (event) {
    let inputed = $input.value;
    if (!inputed || inputed.length === 0) {
      $input.setAttribute("data-prev", inputed);
      updateHexInput(inputed);
      return;
    }
    let valid = [];
    for (let i in inputed) {
      let ch = inputed[i];
      if ("0123456789abcdefABCDEF*".indexOf(ch) >= 0) {
        valid.push(ch.toUpperCase());
      }
    }
    newText = valid.join("");
  }

  // Concat
  // let headStart = 0;
  // let headEnd = $input.selectionStart - 1;
  // let head = headEnd < headStart ? "" : originText.substr(headStart, headEnd - headStart);
  // let tailStart = $input.selectionEnd;
  // let tailEnd = originText.length;
  // let tail = tailStart < tailEnd ? originText.substr(tailStart) : "";
  // console.log("head", head, "replaced", newText, "tail", tail);
  // let newValue = head + newText + tail;

  // set value
  $input.value = newText;
  $input.setAttribute("data-prev", newText);
  $input.setSelectionRange(cursorPos, cursorPos);
  updateHexInput(newText, document.querySelector("section.resolve"));
}
function handleOriginInputChanges(event) {
  let $input = document.getElementById("original-text");
  let originText = $input.value.trim();
  let hexes = str2hex(originText).toUpperCase();
  console.log("Original Inputed", originText, hexes);
  updateHexInput(hexes, document.querySelector("section.maker"));
} 
function str2hex(input) {
  try {
    return unescape(encodeURIComponent(input))
      .split("")
      .map((x) => x.charCodeAt(0).toString(16))
      .join("");
  } catch {
    return null;
  }
}
function cutText(input) {
  let index = 0;
  let cutted = [];
  while (index < input.length) {
    let byte = input.substr(index, 2);
    let rest = input.substr(index);
    let textLength = 2;
    byte = byte.padEnd(2, "0");
    if ("89AB".indexOf(byte[0]) >= 0) {
      textLength = 2;
    }
    if ("CD".indexOf(byte[0]) >= 0) {
      // Dual byte text
      textLength = 4;
    }
    if (byte[0] === "E") {
      textLength = 6;
    }
    if (byte[0] === "F" && "01234567".indexOf(byte[1]) >= 0) {
      textLength = 8;
    }
    if (byte[0] === "F" && "89AB".indexOf(byte[1]) >= 0) {
      textLength = 10;
    }
    if (byte[0] === "F" && "CD".indexOf(byte[1]) >= 0) {
      textLength = 12;
    }
    if (byte[0] === "*") {
      textLength = 2;
      for (var i = 2; i < rest.length; i += 2) {
        if ("89AB*".indexOf(rest[i]) >= 0) {
          textLength += 2;
        } else {
          break;
        }
      }
    }
    let text = input.substr(index, textLength);
    text = text.padEnd(textLength, "0");
    cutted.push(text);
    index += textLength;
  }
  return cutted;
}
function divideText(hexstring) {
  let bytestr = [];
  for (var i = 0; i < hexstring.length; i += 2) {
    if (i + 1 >= hexstring.length) {
      break;
    }
    bytestr.push(`${hexstring[i]}${hexstring[i + 1]}`);
  }
  return bytestr;
}
function hex2text(bytestr) {
  let escstr = "";
  for (var i = 0; i < bytestr.length; i++) {
    escstr += bytestr[i];
  }
  // Solution from: https://stackoverflow.com/a/13865680/7392637
  try {
    let result = decodeURIComponent(escstr.replace(/\s+/g, "").replace(/[0-9A-F]{2}/g, "%$&"));
    return result;
  } catch {
    return null;
  }
}
function makeHexTextNode(hexstr, index) {
  let hexbytes = divideText(hexstr);
  let text = hex2text(hexbytes);
  if (text === null) {
    text = "?";
  }

  $global.hexRenderList.push(makeSingleText(index, hexstr, text));
}
function makeSingleText(index, hexstr, text) {
  let hexbytes = divideText(hexstr);
  let byteNodes = hexbytes.map((x) => {
    return `<div class="hexbox-byte">${x}</div>`;
  });
  return `
    <div class="hexbox-single-text" data-index="${index}">
      <div class="hexbox-hex-string">${byteNodes.join("")}</div>
      <div class="hexbox-character">
        <span className="hexbox-character-text">${text}</span>
      </div>
    </div>`.trimStart();
}
function renderHexTextNodes($root) {
  if ($global && $global.hexRenderList && Array.isArray($global.hexRenderList)) {
    let $container = $root.querySelector(".hexbox-container");
    $container.innerHTML = $global.hexRenderList.join("");
    $global.hexRenderList = null;
  }
}
function renderCandidates() {
  let activatedIndex = $global.activateHexboxIndex;
  if (activatedIndex >= 0) {
    let activatedRecord = $global.activatedRecord;
    //console.log("renderCandidates called: ", activatedIndex, activatedRecord);
    if (activatedRecord) {
      let candidates = activatedRecord.candidates;
      let $operationPanel = document.querySelector("section.resolve .operation-panel");
      $operationPanel.innerHTML = "";
      let html = [];
      //console.log("render candidates ", candidates);
      for (let ci in candidates) {
        let c = candidates[ci];
        html.push(
          `
          <div class="candidate-item" data-index="${ci}">
            <div class="candidate-text">${c.text}</div>
            <div class="candidate-code">${c.hex}</div>
          </div>`.trimStart()
        );
      }
      $operationPanel.innerHTML = html.join("");
    }
  }
}
function listCandidates(startSearch) {
  let candidates = [];
  let searchs = new Set();
  let hasWC = startSearch.indexOf("*") >= 0;
  if (!hasWC) {
    return new Set([startSearch]);
  }
  searchs.add(startSearch);
  //console.log(searchs);
  while (hasWC) {
    hasWC = false;
    for (let search of searchs) {
      searchs.delete(search);
      let wildcastPos = search.indexOf("*");
      //console.log("Analysis search:", search, wildcastPos);
      if (wildcastPos < 0) {
        var text = hex2text(search);
        if (text === null) {
          //console.log(search + " is not a candidate, skip.");
        } else {
          //console.log("Find one candidates: ", search, text);
          candidates.push({ hex: search, text: text });
        }
      } else {
        hasWC = true;
        let head = search.substr(0, wildcastPos);
        let tail = search.substr(wildcastPos + 1);
        "0123456789ABCDEF".split("").forEach((x) => {
          searchs.add(head + x + tail);
          //console.log("Add search candidates: ", head + x + tail);
        });
      }
    }
  }
  //console.log("listCandidates, candidates:", candidates);
  return candidates;
}
function updateCandidates() {
  if ($global && $global.records && Array.isArray($global.records)) {
    $global.records.forEach((x) => {
      let candidates = listCandidates(x.text);
      x.candidates = candidates;
    });
  }
}
function updateActivateHexbox(hexboxSingleTextRoot) {
  let $container = document.querySelector("section.resolve .hexbox-container");

  $global.activateHexboxIndex = parseInt(hexboxSingleTextRoot.getAttribute("data-index"));
  $global.activateHexboxNode = hexboxSingleTextRoot;
  $global.activatedRecord = $global.records.find((x) => x.id == $global.activateHexboxIndex);
  //console.log("update activated:", $global.activateHexboxIndex, $global.activatedRecord, $global.activateHexboxNode);
  $container.querySelectorAll(".hexbox-single-text").forEach((x) => x.classList.remove("activated"));
  hexboxSingleTextRoot.classList.add("activated");
  renderCandidates();
}
function updateMeta($root) {
  let resolves = [];
  let texts = [];
  if ($global && $global.records && Array.isArray($global.records)) {
    $global.records.forEach((x) => {
      if (x.resolve >= 0) {
        let r = x.candidates[x.resolve];
        if (r && r.hex && r.text) {
          resolves.push(r.hex);
          texts.push(r.text);
          return;
        }
      }
      resolves.push(x.text);
      texts.push(hex2text(x.text));
    });
    try {
      $root.querySelector(".hex-boxes-wrap .secret-result-hex .content").textContent = resolves.join("");
      $root.querySelector(".hex-boxes-wrap .secret-result-text .content").textContent = texts.join("");
    } catch {
      // ignore.
    }
  }
}
function updateResolve(candidateRoot) {
  document.querySelectorAll("section.resolve .operation-panel .candidate-item").forEach((x) => x.classList.remove("activated"));
  let activateRecord = $global.activatedRecord;
  let index = candidateRoot.getAttribute("data-index");
  activateRecord.resolve = index;
  candidateRoot.classList.add("activated");
  //console.log("updateResolve", activateRecord);
  // update hexbox
  let $hexbox = document.querySelector(`section.resolve .hexbox-container .hexbox-single-text[data-index="${$global.activateHexboxIndex}"]`);
  if (activateRecord) {
    var resolve = activateRecord.candidates[index];
    if ($hexbox) {
      let node = makeSingleText($global.activateHexboxIndex, resolve.hex, resolve.text);
      $hexbox.outerHTML = node;
    }
  }
  updateMeta(document.querySelector("section.resolve"));
}
function DOMParentClassLookup(startNode, targetClass) {
  var node = startNode;
  while (node && node.tagName.toLowerCase() != "body") {
    if (node.classList.contains(targetClass)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
function bindHexboxEvent() {
  let $container = document.querySelector("section.resolve");
  $container.addEventListener("click", (e) => {
    let $target = DOMParentClassLookup(e.target, "hexbox-single-text");
    //console.log("hexbox clicked!!! ", e.target, $target);
    if ($target) {
      updateActivateHexbox($target);
    }
  });

  $container.addEventListener("click", (e) => {
    let $target = DOMParentClassLookup(e.target, "candidate-item");
    if ($target) {
      updateResolve($target);
    }
  });
}
function resolveText(record) {
  if (record.candidates && record.resolve >= 0) {
    let resolve = record.candidates[record.resolve];
    return resolve;
  }
  return record.text;
}
function regenerateHexBoxes($root) {
  //let $container = document.querySelector("section.resolve .hexbox-container").innerHTML = "";
  $global.hexRenderList = [];
  $global.activateHexboxIndex = -1;
  $global.activateHexboxNode = null;
  $global.activatedRecord = null;
  if ($global && $global.records && Array.isArray($global.records)) {
    $global.records.forEach((x) => {
      let resolvedText = resolveText(x);
      makeHexTextNode(resolvedText, x.id);
    });
    updateCandidates();
    renderHexTextNodes($root);
    updateMeta($root);
  }
}
function updateHexInput(text, $root) {
  let cutted = cutText(text);
  let records = [];
  // Debug log
  //console.log("updateHexInput triggered:", text, cutted);
  if (cutted) {
    let index = 0;
    for (var i = 0; i < cutted.length; i++) {
      let text = cutted[i];
      let item = {
        id: index,
        text: text,
        candidates: [],
        resolve: -1
      };
      index += text.length;
      records.push(item);
    }
    $global.records = records;
  } else {
    $global.records = [];
  }
  regenerateHexBoxes($root);
}
//#endregion
document.addEventListener("DOMContentLoaded", (event) => {
  bindHexboxEvent();
  bindTabFunctions();

  // Bind events for the hex-secret input.
  document.getElementById("hex-secret").addEventListener("input", handleSecretInputChanges);
  document.getElementById("original-text").addEventListener("input", handleOriginInputChanges);
});
