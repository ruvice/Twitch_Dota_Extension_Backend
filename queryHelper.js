// Pick
const getPickWinrateString = (returnedResult, id) => {
  const parsedResult = returnedResult.data.player.heroPerformance
  const { winCount, matchCount } = parsedResult
  const winRate = Math.round(winCount / matchCount * 100)
  const string = `You have a ${winRate}% win rate on ${HERO_ID_MAPPING[id]} in the past 4 patches!`
  return string
}

const getPickStreakString = (returnedResult) => {
  const parsedResult = returnedResult.data.player.heroPerformance
  const { streak } = parsedResult
  let string = `You have a ${streak} gamems win streak on ${HERO_ID_MAPPING[id]}!`
  switch(getRandom(3)){
    case 0:
      string = `You have a ${streak} gamems win streak on ${HERO_ID_MAPPING[id]}!`
      break
    case 1:
      string = `${streak} wins in a row on ${HERO_ID_MAPPING[id]}!`
      break
    case 2:
      string = `${streak}-0? Best ${HERO_ID_MAPPING[id]}!`
      break
    case 3:
      string = `${streak}-0? Top ${HERO_ID_MAPPING[id]}!`
      break
    default:
      break

  }
  return string
}

const getLevelString = (returnedResult, level) => {
  const parsedResult = returnedResult.data.player.matches[0].players[0].stats.level
  const timestampPrev = parsedResult[level - 1]
  const minTimestamp = Math.floor(timestampPrev/60)
  const secTimestamp = timestampPrev % 60 
  const string = `You were level ${level} at ${minTimestamp} min ${secTimestamp} sec in the last game!`
  return string
}

const getBeginString = (returnedResult) => {
  const parsedResult = returnedResult.data.player.matches
  let winStreak = 0
  for (i in parsedResult) {
    if (parsedResult[i].players[0].isVictory) {
      winStreak += 1
    } else {
      break
    }
  }
  let string = 'Here we go again!'
  if (winStreak <= 0) {
    string = `Oh my! Mr Streamer needs your support, he has a 0 win streak now!`
  } else if (winStreak <= 5) {
    switch(getRandom(2)) {
      case 0: 
        string = `Pog! Mr Streamer has a ${winStreak} win streak. Cheer him on!`
        break
      case 1: 
        string = `Wuddya know? A ${winStreak} win streak!`
        break
      case 2: 
        string = `${winStreak} win streak? Green days ahead!`
        break
      default:
        break
    }
  } else {
    switch(getRandom(3)) {
      case 0: 
        string = `WTF Mr Streamer has a ${winStreak} win streak. Is this where we lose?`
        break
      case 1: 
        string = `Mmm ${winStreak} win streak...`
        break
      case 2: 
        string = `${winStreak} wins in a row? IN A ROW???`
        break
      case 3: 
        string = `${winStreak} wins, 0 losses. Smurf? Hello???`
        break
      default:
        break
    }
  }
  return string
}

// Outcome
const getOutcomeString = (isVictory) => {
  if (isVictory) {
    switch(getRandom(2)) {
      case 0: 
        string = `Pog! We won!`
        break
      case 1: 
        string = `Easy game`
        break
      case 2: 
        string = `Chat carried`
        break
      default:
        break
    }
  } else {
    switch(getRandom(2)) {
      case 0: 
        string = `Stream snipers...`
        break
      case 1: 
        string = `Giving opponents a chance`
        break
      case 2: 
        string = `Must be chat's fault`
        break
      default:
        break
    }
  }
  return string
}

// This should match order of queries.js
const handleEventString = {
  pick: [getPickWinrateString, getPickStreakString],
  level: [getLevelString],
  begin: [getBeginString],
  outcome: [getOutcomeString],
}

const getRandom = (max) => {
  return Math.floor(Math.random() * max)
}

const HERO_ID_MAPPING = {
  1 : "Anti-Mage",
  2 : "Axe",
  3 :"Bane",
  4 :"Bloodseeker",
  5 :"Crystal Maiden",
  6 :"Drow Ranger",
  7 :"Earthshaker",
  8 :"Juggernaut",
  9 :"Mirana",
  10: "Morphling",
  11 : "Shadow Fiend",
  12 : "Phantom Lancer",
  13 : "Puck",
  14 : "Pudge",
  15 : "Razor",
  16 : "Sand King",
  17 : "Storm Spirit",
  18 : "Sven",
  19 : "Tiny",
  20 : "Vengeful Spirit",
  21 : "Windranger",
  22 : "Zeus",
  23 : "Kunkka",
  25 : "Lina",
  26 : "Lion",
  27 : "Shadow Shaman",
  28 : "Slardar",
  29 : "Tidehunter",
  30 : "Witch Doctor",
  31 : "Lich",
  32 : "Riki",
  33 : "Enigma",
  34 : "Tinker",
  35 : "Sniper",
  36 : "Necrophos",
  37 : "Warlock",
  38 : "Beastmaster",
  39 : "Queen of Pain",
  40 : "Venomancer",
  41 : "Faceless Void",
  42 : "Wraith King",
  43 : "Death Prophet",
  44 : "Phantom Assassin",
  45 : "Pugna",
  46 : "Templar Assassin",
  47 : "Viper",
  48 : "Luna",
  49 : "Dragon Knight",
  50 : "Dazzle",
  51 : "Clockwerk",
  52 : "Leshrac",
  53 : "Nature's Prophet",
  54 : "Lifestealer",
  55 : "Dark Seer",
  56 : "Clinkz",
  57 : "Omniknight",
  58 : "Enchantress",
  59 : "Huskar",
  60 : "Night Stalker",
  61 : "Broodmother",
  62 : "Bounty Hunter",
  63 : "Weaver",
  64 : "Jakiro",
  65 : "Batrider",
  66 : "Chen",
  67 : "Spectre",
  68 : "Ancient Apparition",
  69 : "Doom",
  70 : "Ursa",
  71 : "Spirit Breaker",
  72 : "Gyrocopter",
  73 : "Alchemist",
  74 : "Invoker",
  75 : "Silencer",
  76 : "Outworld Destroyer",
  77 : "Lycan",
  78 : "Brewmaster",
  79 : "Shadow Demon",
  80 : "Lone Druid",
  81 : "Chaos Knight",
  82 : "Meepo",
  83 : "Treant Protector",
  84 : "Ogre Magi",
  85 : "Undying",
  86 : "Rubick",
  87 : "Disruptor",
  88 : "Nyx Assassin",
  89 : "Naga Siren",
  90 : "Keeper of the Light",
  91 : "Io",
  92 : "Visage",
  93 : "Slark",
  94 : "Medusa",
  95 : "Troll Warlord",
  96 : "Centaur Warrunner",
  97 : "Magnus",
  98 : "Timbersaw",
  99 : "Bristleback",
  100 : "Tusk",
  101 : "Skywrath Mage",
  102 : "Abaddon",
  103 : "Elder Titan",
  104 : "Legion Commander",
  105 : "Techies",
  106 : "Ember Spirit",
  107 : "Earth Spirit",
  108 : "Underlord",
  109 : "Terrorblade",
  110 : "Phoenix",
  111 : "Oracle",
  112 : "Winter Wyvern",
  113 : "Arc Warden",
  114 : "Monkey King",
  119 : "Dark Willow",
  120 : "Pangolier",
  121 : "Grimstroke",
  123 : "Hoodwink",
  126 : "Void Spirit",
  128 : "Snapfire",
  129 : "Mars",
  135 : "Dawnbreaker",
  136 : "Marci"
}

module.exports = { handleEventString, getRandom }