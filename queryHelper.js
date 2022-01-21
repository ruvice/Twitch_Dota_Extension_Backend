const getPickString = (returnedResult) => {
  const { winCount, matchCount } = returnedResult
  const winRate = Math.round(winCount / matchCount * 100)
  const string = `You have a ${winRate}% win rate on this hero in the past 4 patches!`
  return string
}

const handleEventString = (returnedResult, query) => {
  // query should identify which query was run, determines which of the above are parsed
  // currently only one so fk it
  return getPickString(returnedResult)
}

module.exports = handleEventString