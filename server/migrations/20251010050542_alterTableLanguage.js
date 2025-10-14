exports.up = function (knex) {
    return knex('language').insert([
        {
            name: 'Chinese',
            code: 'zh',
            flag: 'CN',
            status: 'active'
        },
        {
            name: 'Russian',
            code: 'ru',
            flag: 'RU',
            status: 'active'
        },
        {
            name: 'Polish',
            code: 'pl',
            flag: 'PL',
            status: 'active'
        },
        {
            name: 'Greek',
            code: 'el',
            flag: 'GR',
            status: 'active'
        },
        {
            name: 'Swedish',
            code: 'sv',
            flag: 'SE',
            status: 'active'
        }
    ]);
};
 
exports.down = function (knex) {
    return knex('language')
        .whereIn('code', ['zh', 'ru', 'pl', 'el', 'sv'])
        .del();
};