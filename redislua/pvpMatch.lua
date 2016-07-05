-- {"nameOfCommand": "pvpMatch", "numberOfKeys": 1}
local existUser = redis.call("hexists", "match", KEYS[1]);
local matchs = redis.call("hgetall", 'match');
local playerNum = ARGV[1] + 0;
local matchNum = table.getn(matchs);
local array = {};

if (existUser == 1) then
    if (matchNum >= playerNum) then
        for i=1,playerNum do
            array[i] = matchs[i];
        end
        redis.call("hdel", "match", unpack(array));
        return array;
    end

    -- TODO: 要不要重新设置匹配失效时间
    redis.call('hset', "match", KEYS[1], 1);
    return 0;
end

if (matchNum < playerNum - 1) then
    -- 设置匹配失效时间
    redis.call('hset', "match", KEYS[1], 1);
    return 0;
end

if playerNum > 1 then
    for i=1,playerNum-1 do
        array[i] = matchs[i];
    end
    redis.call("hdel", "match", unpack(array));
end
array[playerNum] = KEYS[1];
return array;

