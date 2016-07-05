-- {"nameOfCommand":"test","numberOfKeys":1}
return redis.pcall('get', KEYS[1], unpack(ARGV));