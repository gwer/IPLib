# IP.js 

IP.js is a small library for working with IP addresses, subnets, masks. It's available in browser and in Node.js.

### Examples:
##### Notes:
* All `ip` arguments expect valid ip (besides `ip` in `parse(ip)` and `isIPv4(ip)`).
* All `mask` arguments expect valid mask. 

##### IP.parse(ip, [isSubnet])
```
> IP.parse('192.168.0.32')
{ ip: '192.168.0.32',
  mask: '255.255.255.0' }
> IP.parse('192.168.0.32', true)
{ ip: '192.168.0.32',
  mask: '255.255.255.224' }
> IP.parse('192.168.0.0', true)
{ ip: '192.168.0.0',
  mask: '255.255.255.0' }
> IP.parse('192.168.0.0/22', true)
{ ip: '192.168.0.0',
  mask: '255.255.252.0' }
> IP.parse('192.168.0.256')
null
```
##### isMask(ip)
```
> IP.isMask('255.255.255.0')
true
> IP.isMask('255.255.255.1')
false
```
##### IP.isValidMaskForSubnet(subnet, mask)
```
> IP.isValidMaskForSubnet('192.168.0.0', '255.255.255.0')
true
> IP.isValidMaskForSubnet('192.168.0.0', '255.0.0.0')
false
```
##### IP.isIpFromSubnet(subnet, mask, ip)
```
> IP.isIpFromSubnet('192.168.0.0', '255.255.255.0', '192.168.0.1')
true
> IP.isIpFromSubnet('192.168.0.0', '255.255.255.0', '192.168.0.0')
true
> IP.isIpFromSubnet('192.168.0.0', '255.255.255.0', '192.168.1.0')
false
```
##### IP.getNextIp(ip)
```
> IP.getNextIp('192.168.0.0')
'192.168.0.1'
```
##### IP.getMaskLength(mask)
```
> IP.getMaskLength('255.255.255.0')
24
> IP.getMaskLength('255.255.255.255')
32
> IP.getMaskLength('255.255.255.254')
31
> IP.getMaskLength('0.0.0.0')
32 // Oh god why
```
##### IP.isIPv4(ip)
```
> IP.isIPv4('192.168.0.1')
true
> IP.isIPv4('192.168.0.256')
false
> IP.isIPv4('0.0.0.0')
true
```
##### IP.isIPv6(ip)
```
> IP.isIPv6('0.0.0.0')
false
> IP.isIPv6('1::1')
true
```
