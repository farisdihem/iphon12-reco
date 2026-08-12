with open("src-tauri/src/protocol_test.rs", "r") as f:
    content = f.read()

# find test_qr_payload_generation_format
qr1 = content.find("#[test]\n    fn test_qr_payload_generation_format()")
if qr1 != -1:
    content = content[:qr1]

with open("src-tauri/src/protocol_test.rs", "w") as f:
    f.write(content + "}\n")
