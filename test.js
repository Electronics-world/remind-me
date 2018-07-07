const { getFurureDateByCommentTextAndContextDate } = require('./parser');
const { toBlockchainDateString } = require('./helpers')

const inputs = [
    '@remind-me in 48 hours',
    '@remind-me in 7 days',
    '@remind-me in two months',
    '@remind-me on 1 April 2019 13:00',
    '@remind-me on 12.24.2019 06:00',
    '@remind-me tomorrow',
    '@remind-me on Wednesday at 18:50'
]

const start = '2018-05-01T15:00:00';
console.log('start', start)
inputs.forEach(comment => {
    const future = getFurureDateByCommentTextAndContextDate(comment, start);
    const futureDate = future && toBlockchainDateString(future);
    console.log(comment, future ? futureDate : 'not valid')
})