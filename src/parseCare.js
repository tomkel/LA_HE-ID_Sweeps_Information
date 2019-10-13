const pdfjsLib = require('pdfjs-dist')
const R = require('ramda')
const fs = require('fs')

const url = 'https://cdn.glitch.com/6be5b6e9-3e78-4f26-91f9-ac968b43d306%2FCARE%20Program%20Confirmation%20Sheet%2010.11.pdf'

const tap = (fn) => (arg) => {
  fn(arg)
  return arg
}

/*
 type textItem {
  str: string;
  transform: array;
}
x = item.transform[4]
y = item.transform[5]
0,0 is at bottom left corner

type myTextItem {
  str: string;
  x: number;
  y: number;
}

type viewport {
  viewbox: [0, 0, width, height]
}
*/


const peek = (arr) => arr[0]
const getPageHeight = (page) => page.getViewport().viewBox[3]

// transform Y value so it is as if all items are on one page
const transformTextItems = ({ pageHeight, numPages }) => (textItems, pageI) => textItems.map((textItem) => ({
  str: textItem.str.trim(),
  x: textItem.transform[4],
  y: textItem.transform[5] + (numPages - (pageI + 1)) * pageHeight,
  width: textItem.width,
}))

const isSameRow = (y) => (textItem) => y === textItem.y
const sortByX = (row) => row.sort((a, b) => (a.x - b.x))
const sortByY = (row) => row.sort((a, b) => (a.y - b.y))
// If there are duplicate headers on a row, split the row in two
const splitRowByGrid = (row) => {
  const firstHeader = peek(row).str
  const splitI = R.findLastIndex(R.propEq('str', firstHeader), row)

  if (splitI === 0) return [row]

  return [row.slice(0, splitI), row.slice(splitI)]
}

const getGridHeaders = (textItemArr) => textItemArr
  .filter(({ str }) => str === 'Address')
  .map(({ y }) => textItemArr.filter(isSameRow(y)))
  .map(sortByX)
  .flatMap(splitRowByGrid)

let pageHeight
const { promise: pdf } = pdfjsLib.getDocument(url)
pdf
  .then((doc) => Promise.all(
    Array(doc.numPages).fill().map((_, i) => doc.getPage(i + 1)),
  ))
  .then(tap((pages) => { pageHeight = getPageHeight(peek(pages)) }))
  .then((pages) => Promise.all(pages.map((page) => page.getTextContent())))
  .then((contentArr) => contentArr.map(({ items }) => items))
  .then((textItemArrArr) => textItemArrArr.map(transformTextItems({ pageHeight, numPages: textItemArrArr.length })).flat())
//  .then(tap(console.log))

// .then(tap((textItemArr) => fs.writeFileSync('care-10-11.json', JSON.stringify(textItemArr))))

  .then(sortByY)
  .then((textItemArr) => {
    const headers = getGridHeaders(textItemArr)
    const rows = R.groupWith((a, b) => Math.abs(a.y - b.y) < 5.0, textItemArr)
    console.log(rows.length)
  })
  .catch((e) => console.error('ERROR!!', e))
