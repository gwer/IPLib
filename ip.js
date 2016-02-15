;(function () {
    var ipv4Pattern = /^((?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))(?:\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
        ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/

    var IP = {
            parse: parse,
            isMask: isMask,
            isValidMaskForSubnet: isValidMaskForSubnet,
            isIpFromSubnet: isIpFromSubnet,
            getNextIp: getNextIp,
            getMaskLength: getMaskLength,
            isIPv4: isIPv4,
            isIPv6: isIPv6
        }

    function parse(ip, isSubnet) {
        var result = ipv4Pattern.exec(ip)

        if (!result) return null
        if (!result[2]) {
            return {
                ip: ip,
                mask: bitsetToIp(getMaskByIp(ip, isSubnet))
            }
        }
        return {
            ip: result[1],
            mask: bitsetToIp(getMaskByLength(+result[2]))
        }
    }

    function isMask(ip) {
        var binIp = getBinaryIp(ip)

        return !(~binIp & (-binIp))
    }

    function isValidMaskForSubnet(subnet, mask) {
        return !(~getBinaryIp(mask) & getBinaryIp(subnet))
    }

    function isIpFromSubnet(subnet, mask, ip) {
        var binSubnet = getBinaryIp(subnet),
            binMask = getBinaryIp(mask),
            binIp = getBinaryIp(ip)

        return !((binSubnet ^ binIp) & binMask)
    }

    function getNextIp(ip) {
        return bitsetToIp(getBinaryIp(ip) + 1)
    }

    function getMaskLength(mask) {
        return getMaskLengthByLowBit(getBinaryIp(mask))
    }

    function isIPv4(ip) {
        return ipv4Pattern.test(ip)
    }

    function isIPv6(ip) {
        return ipv6Pattern.test(ip)
    }

    function getMaskByIp(ip, isSubnet) {
        return getMaskByLength(getMaskLengthByIp(ip, isSubnet))
    }

    function getMaskByLength(length) {
        /**
         *  In JS `a << b` is equal `a << b%32`.
         *  So ~0 << 32 === ~0.
         */
        return length ? ~0 << (32 - length) : 0
    }

    function getMaskLengthByIp(ip, isSubnet) {
        var binIp = getBinaryIp(ip),
            highOctet = binIp >>> 24
        
        if (!isSubnet) { /* Mask by the class */
            if (isInRange(highOctet, 0, 128)) return 8      /* Class A */
            if (isInRange(highOctet, 128, 192)) return 16   /* Class B */
            if (isInRange(highOctet, 192, 224)) return 24   /* Class C */
        }

        /* Try to get mask by the class, otherwise get the shortest mask */
        if (isClassfulSubnet(binIp, 'A')) return 8
        if (isClassfulSubnet(binIp, 'B')) return 16
        if (isClassfulSubnet(binIp, 'C')) return 24
        if (isInRange(highOctet, 0, 224)) return getMaskLengthByLowBit(binIp)

        /* 0.0.0.0 — why not? */
        return 0
    }

    function getBinaryIp(ip) {
        var octets = ip.split('.').map(Number),
            bitset = 0

        octets.forEach(shiftOr)
        return bitset

        function shiftOr(octet) {
            bitset = bitset << 8 | octet
        }
    }

    function isClassfulSubnet(binSubnet, netClass) {
        var classRanges = {
                A: {start: 0,   end: 128, maskLength: 8},
                B: {start: 128, end: 192, maskLength: 16},
                C: {start: 192, end: 224, maskLength: 24}
            },
            highOctet = binSubnet >>> 24,
            curClass = classRanges[netClass]

        return isInRange(highOctet, curClass.start, curClass.end)
                && !(binSubnet << curClass.maskLength)
    }

    function isInRange(num, start, end) {
        return (num >= start && num < end)
    }

    function getMaskLengthByLowBit(subnetBitset) {
        if (!subnetBitset) return 0

        var onlyLowBit = -subnetBitset & subnetBitset,
            /* It's the fastest way */
            pow = ~~(Math.log(onlyLowBit >>> 0) / Math.LN2)

        return 32 - pow
    }
    
    function bitsetToIp(bitset) {
        var octets = [],
            fullOctet = 255

        for (var i = 0; i < 4; i++) {
            octets.unshift(bitset & fullOctet)
            bitset >>>= 8
        }
        return octets.join('.')
    }

    if (typeof module !== 'undefined'
        && typeof module.exports !== 'undefined') {
        module.exports = IP
    } else {
        window.IP = IP
    }
})()
