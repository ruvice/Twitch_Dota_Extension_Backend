const gql = require("graphql-tag");

const PLAYER_PICK_QUERY = gql`
  query getPlayerPick($steamAccountId: Long!, $heroId: Short!){
    player(steamAccountId: $steamAccountId){
      steamAccountId
      heroPerformance(heroId: $heroId, request:{minGameVersionId: 146, maxGameVersionId: 149}){
        matchCount
        winCount
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
  pick: PLAYER_PICK_QUERY,
  test: TEST_QUERY,
}

module.exports = queryCollection;
