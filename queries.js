const gql = require("graphql-tag");

const PLAYER_PICK_QUERY_WINRATE = gql`
  query getPlayerPickWinrate($steamAccountId: Long!, $heroId: Short!){
    player(steamAccountId: $steamAccountId){
      heroPerformance(heroId: $heroId, request:{minGameVersionId: 146, maxGameVersionId: 149}){
        matchCount
        winCount
      }
    }
  }
` 

// Need to test this
const PLAYER_PICK_QUERY_STREAK = gql`
  query getPlayerPickStreak($steamAccountId: Long!, $heroId: Short!){
    player(steamAccountId: $steamAccountId){
      heroPerformance(heroId: $heroId, request:{}){
        streak
      }
    }
  }
`

// Each level is one tick, represented by timestamp in seconds
const PLAYER_LEVEL_QUERY = gql`
  query getPlayerLevel($steamAccountId: Long!){
    player(steamAccountId: $steamAccountId) {
      matches(request: { take:1 }) {
        players(steamAccountId: $steamAccountId) {
          stats {
            level
            
          }
        }
      }
    }
  }
`

const PLAYER_BEGIN_QUERY_STREAK = gql`
  query getPlayerStreakGeneral($steamAccountId: Long!) {
    player(steamAccountId: $steamAccountId) {
      matches(request: {take: 25}) {
        players(steamAccountId: $steamAccountId) {
          isVictory
        }
      }
    }
  }
`

const TEST_QUERY = gql`
  query gameMode{
    constants{
      heroes{
        id
        displayName
      }
    }
  }
`

const queryCollection = {
  pick: [PLAYER_PICK_QUERY_WINRATE, PLAYER_PICK_QUERY_STREAK],
  test: [TEST_QUERY],
  level: [PLAYER_LEVEL_QUERY],
  begin: [PLAYER_BEGIN_QUERY_STREAK]
}

module.exports = queryCollection;
