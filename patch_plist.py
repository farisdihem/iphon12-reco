import plistlib
import sys

with open(sys.argv[1], 'rb') as f:
    pl = plistlib.load(f)

pl['CFBundleURLTypes'] = [{
    'CFBundleURLName': 'com.nexuslink.ios.companion',
    'CFBundleURLSchemes': ['nexuslink']
}]

with open(sys.argv[1], 'wb') as f:
    plistlib.dump(pl, f)
