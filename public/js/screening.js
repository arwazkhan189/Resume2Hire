//mapping words to frequency

function wordCountMap(str) {
  let words = str.split(" ");
  let wordCount = {};
  words.forEach((w) => {
    wordCount[w] = (wordCount[w] || 0) + 1;
  });
  return wordCount;
}

//Dictionary to contain all the words that are present in both dictionary

function addWordsToDictionary(wordCountmap, dict) {
  for (let key in wordCountmap) {
    dict[key] = true;
  }
}

//Now we can change our word count map into a vector using our dictionary.

function wordMapToVector(map, dict) {
  let wordCountVector = [];
  for (let term in dict) {
    wordCountVector.push(map[term] || 0);
  }
  return wordCountVector;
}

//finding cosine similarity between two vectors

//dot product
function dotProduct(vecA, vecB) {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

//magnitude
function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(vecA, vecB) {
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

//Now we have everything we need,
//but lets make our life more easier by adding a function that takes two strings rather than vectors.

function textCosineSimilarity(txtA, txtB) {
  const wordCountA = wordCountMap(txtA);
  const wordCountB = wordCountMap(txtB);
  let dict = {};
  addWordsToDictionary(wordCountA, dict);
  addWordsToDictionary(wordCountB, dict);
  const vectorA = wordMapToVector(wordCountA, dict);
  const vectorB = wordMapToVector(wordCountB, dict);
  return cosineSimilarity(vectorA, vectorB);
}

//similarity score

function getSimilarityScore(val) {
  return Math.round(val * 100);
}

const form = document.querySelector("form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const jd = document.getElementById("story").value;
  const val = textCosineSimilarity(jd, data);
  console.log(jd);
  console.log(data);
  console.log(getSimilarityScore(val));
});
