from pathlib import Path
import hashlib,json,re

def verify_entry(path,entry):
 path=Path(path)
 if isinstance(entry,str):
  digest=entry
 else:
  assert isinstance(entry,dict),'unsupported manifest entry'
  assert type(entry.get('bytes')) is int and entry['bytes']>=0,'invalid bytes'
  assert path.stat().st_size==entry['bytes'],'manifest bytes mismatch:'+str(path)
  digest=entry.get('sha256')
 assert isinstance(digest,str) and re.fullmatch(r'[a-f0-9]{64}',digest),'invalid sha256'
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,'manifest SHA mismatch:'+str(path)

def verify_manifest(root,manifest_path):
 root=Path(root);data=json.loads(Path(manifest_path).read_text())
 assert isinstance(data.get('files'),dict) and data['files'],'missing manifest files'
 for relative,entry in data['files'].items():verify_entry(root/relative,entry)
 return len(data['files'])
