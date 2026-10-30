// AIWANNA IDs are filled in after the first publish; until then online requests stay off.
export const leaderboardConfig = {
 origin:'https://www.aiwanna.games',
 origins:['https://www.aiwanna.games','https://aiwanna.games','https://www.ai-made.games','https://ai-made.games','https://1gp-game-platform.vercel.app'],
 gameId:'51453934-671e-430a-b83d-a6f7d2e0e3cf',gameSlug:'game-99dd9af2f4e01f7a',boards:{total:'f322b2f3-e0bc-4b5c-b490-f320a88c98ac'},minScore:1,maxScore:1000000000,
};
// One board: the sum of a player's best score on every track and difficulty.
export const boardDefinition = {
 key:'total-best-v1',name:'总分 · Total score',
 description:'所有曲目和难度的个人最佳分数之和，分高者排前。The sum of your best score on every track and difficulty. Higher is better.',
 order:'desc',unit:'points',minScore:1,maxScore:1000000000,minPlayMs:0,
};
