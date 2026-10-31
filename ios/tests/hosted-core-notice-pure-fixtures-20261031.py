#!/usr/bin/env python3
"""Pure AST-selected function fixtures. Never imports/executes the Hosted module.
No Git/Swift/SDK/Node/network command, real child or global environment changes.
"""
import ast, hashlib, json, signal, subprocess, types
from pathlib import Path
GUARD=Path(__file__).parent/'observe-core-notice-hosted-20261031.py'
EXPECTED='3f5b2d6a764bcaf6fe1b41bd3052af4bd5686f2f11d72cd3f14e1a77b109e975'
source=GUARD.read_bytes()
assert hashlib.sha256(source).hexdigest()==EXPECTED
module=ast.parse(source)
functions={n.name:n for n in module.body if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef))}
selected=['require','sha','bounded_metadata','metadata_seconds','probe','runtime_git_boundary']
program=ast.Module(body=[functions[n] for n in selected],type_ignores=[])

class Clock:
    def __init__(self):self.now=0.0
    def monotonic(self):return self.now
class Stream:
    def __init__(self,fd,name):self.fd=fd;self.name=name;self.closed=False
    def fileno(self):return self.fd
    def close(self):self.closed=True
class Fixture:
    def __init__(self,stdout=b'',stderr=b'',code=0,idle=False,wait_timeout=False,read_error=False,spawn_error=False,wait_unreaped=False,select_error=False):
        self.clock=Clock();self.data={11:bytearray(stdout),12:bytearray(stderr)};self.code=code;self.idle=idle
        self.wait_timeout=wait_timeout;self.read_error=read_error;self.spawn_error=spawn_error
        self.wait_unreaped=wait_unreaped;self.select_error=select_error
        self.kills=[];self.spawn_count=0;self.waits=[];self.receipts=[];self.child=None;self.selector=None
    def popen(self,argv,**kw):
        self.spawn_count+=1
        assert kw==dict(cwd=Path('/fake-workspace'),env={'PATH':'/fake-bin','TMPDIR':'/fake-tmp/'},stdin=-3,stdout=-1,stderr=-1,start_new_session=True)
        if self.receipts:assert self.receipts[0]['kind']=='intent'
        if self.spawn_error:raise OSError('fake spawn refusal')
        f=self
        class Child:
            pid=73331
            def __init__(self):self.stdout=Stream(11,'stdout');self.stderr=Stream(12,'stderr');self.returncode=None
            def wait(self,timeout):
                f.waits.append(timeout)
                if f.wait_unreaped:f.clock.now+=timeout;raise subprocess.TimeoutExpired('fake',timeout)
                if f.wait_timeout and not f.kills:f.clock.now+=timeout;raise subprocess.TimeoutExpired('fake',timeout)
                self.returncode=-signal.SIGKILL if f.kills else f.code
                return self.returncode
        self.child=Child();return self.child
    def read(self,fd,amount):
        assert 0<amount<=65536
        if self.read_error:raise OSError('fake read refusal')
        result=bytes(self.data[fd][:amount]);del self.data[fd][:amount];return result
    def killpg(self,pid,sig):
        assert self.child and pid==self.child.pid and sig==signal.SIGKILL
        self.kills.append([pid,sig])
    def selector_factory(self):
        f=self
        class Selector:
            def __init__(self):self.rows={};self.closed=False
            def register(self,stream,events,data):self.rows[stream.fd]=types.SimpleNamespace(fd=stream.fd,fileobj=stream,data=data)
            def unregister(self,stream):self.rows.pop(stream.fd)
            def get_map(self):return self.rows
            def select(self,seconds):
                assert 0<seconds<=0.1
                f.clock.now+=seconds if f.idle else min(seconds,0.01)
                if f.select_error:raise OSError('fake select refusal')
                return [] if f.idle else [(v,1) for v in list(self.rows.values())]
            def close(self):self.closed=True
        self.selector=Selector();return self.selector
    def namespace(self):
        ns={'Path':Path,'hashlib':hashlib,'json':json,'signal':signal,'time':self.clock,
            'WORKSPACE':Path('/fake-workspace'),'PROBE_OUTER_DEADLINE':None,
            'subprocess':types.SimpleNamespace(Popen=self.popen,DEVNULL=-3,PIPE=-1,TimeoutExpired=subprocess.TimeoutExpired),
            'os':types.SimpleNamespace(set_blocking=lambda fd,flag:None,read=self.read,killpg=self.killpg),
            'selectors':types.SimpleNamespace(DefaultSelector=self.selector_factory,EVENT_READ=1),
            'uuid':types.SimpleNamespace(uuid4=lambda:'fake-owned-token'),
            'append_probe_receipt':lambda value,reserve=0:self.receipts.append(value)}
        exec(compile(program,'<selected-real-functions>','exec'),ns)
        return ns

def check(name,fixture,expected_reason=None,maximum=8,call_probe=False):
    ns=fixture.namespace();out=err=b'';receipt=None
    if call_probe:
        try:out=ns['probe'](['/fake'],{'PATH':'/fake-bin','TMPDIR':'/fake-tmp/'},maximum)
        except ValueError:
            assert expected_reason is not None
        assert len(fixture.receipts)==2 and fixture.receipts[0]['saved_before_Popen'] is True
        receipt=fixture.receipts[1]
    else:out,err,receipt=ns['bounded_metadata'](['/fake'],{'PATH':'/fake-bin','TMPDIR':'/fake-tmp/'},maximum,1)
    assert receipt['reason']==expected_reason,(name,receipt)
    assert sum(receipt['retained_bytes'].values())<=maximum
    assert sum(receipt['observed_bytes'].values())<=maximum+1
    assert receipt['truncated']==(expected_reason=='combined-output-cap')
    assert receipt['state']==('success' if expected_reason is None else 'refused')
    assert fixture.spawn_count==1
    if fixture.child:
        assert fixture.child.stdout.closed and fixture.child.stderr.closed
        assert fixture.selector.closed
        if not fixture.wait_unreaped:assert receipt['direct_child_reaped']
    return {'name':name,'state':'passed','reason':receipt['reason'],'retained':receipt['retained_bytes'],
            'observed':receipt['observed_bytes'],'kill_count':len(fixture.kills),'direct_child_reaped':receipt['direct_child_reaped']}

results=[]
results.append(check('success-combined-exact-cap',Fixture(b'12345',b'678'),maximum=8))
results.append(check('empty-success',Fixture()))
results.append(check('stdout-plus-one-refuses',Fixture(b'123456789'),'combined-output-cap'))
results.append(check('stderr-plus-one-refuses',Fixture(b'',b'123456789'),'combined-output-cap'))
results.append(check('combined-overcap-refuses',Fixture(b'12345',b'67890'),'combined-output-cap'))
results.append(check('nonzero-refuses',Fixture(b'ok',code=7),'nonzero-exit'))
results.append(check('pipe-deadline-kill-reap',Fixture(idle=True),'deadline'))
results.append(check('EOF-live-child-deadline-kill-reap',Fixture(wait_timeout=True),'deadline'))
results.append(check('spawn-error-no-child',Fixture(spawn_error=True),'exception-OSError'))
results.append(check('read-error-kill-reap',Fixture(read_error=True),'exception-OSError'))
results.append(check('select-error-kill-reap',Fixture(select_error=True),'exception-OSError'))
results.append(check('unreaped-refuses',Fixture(idle=True,wait_unreaped=True),'deadline'))
results.append(check('probe-intent-result-success',Fixture(b'ok'),call_probe=True))
results.append(check('probe-intent-result-refusal',Fixture(b'123456789'),'combined-output-cap',call_probe=True))
f=Fixture();ns=f.namespace();ns['PROBE_OUTER_DEADLINE']=0
try:ns['probe'](['/fake'],{'PATH':'/fake-bin','TMPDIR':'/fake-tmp/'})
except ValueError:pass
else:raise AssertionError('expired outer deadline admitted')
assert f.spawn_count==0 and f.receipts==[]
results.append({'name':'outer-deadline-refuses-before-spawn','state':'passed'})
f=Fixture();ns=f.namespace()
try:ns['bounded_metadata'](['/fake','x'*513],{},8,1)
except ValueError:pass
else:raise AssertionError('argv bound admitted')
assert f.spawn_count==0
results.append({'name':'argv-bound-before-spawn','state':'passed'})
f=Fixture();ns=f.namespace();env={'PATH':'literal-production-path','TMPDIR':'literal-observation/.process-tmp/'}
ns['ROOT']=Path('/fake-root');ns['git_audit']=lambda path,passed_env,bare:{'env':passed_env,'path':str(path),'bare':bare}
ns['git_selection']=lambda passed_env:{'env':passed_env,'version':'fake-version','selector':'held'}
a=ns['runtime_git_boundary'](env);b=ns['runtime_git_boundary'](dict(env));assert a==b and a['environment']==env
ns['git_selection']=lambda passed_env:{'env':passed_env,'version':'drift','selector':'held'}
assert ns['runtime_git_boundary'](env)!=a
results.append({'name':'same-literal-env-and-selection-drift-visible','state':'passed'})
# Static ordering/retention assertions cover real run orchestration without invoking it.
text=source.decode();assert 'capture_output=True' not in text
assert "git_env=child_env(ROOT/'run/observation/.process-tmp')" in text
assert text.index('git_before=runtime_git_boundary(git_env)')<text.index("argv = [str(NODE),str(ROOT/(stage+'-entry.mjs'))]")
assert text.index('outcome = cleanup(child)')<text.index('git_after=runtime_git_boundary(git_env)')
assert "require(git_after==git_before,'Git config/default selection drift after producer')" in text
assert 'Fresh quiescent public Hosted macos-15' in text
results.append({'name':'production-order-cap-removal-and-limited-trust-static','state':'passed'})
# Actual append_probe_receipt AST with fake OS, not the earlier probe append stub.
catalog_program=ast.Module(body=[functions['append_probe_receipt']],type_ignores=[])
class Catalog:
    def __init__(self,size=0,mode=0o100600,partial=False,write_error=False,close_error=False):
        self.size=size;self.mode=mode;self.partial=partial;self.write_error=write_error;self.close_error=close_error
        self.opens=0;self.writes=[];self.closes=0
    def open(self,path,flags,mode):
        assert path==Path('/fake-root/probe-receipts.jsonl') and flags==31 and mode==0o600
        self.opens+=1;return 41
    def fstat(self,fd):assert fd==41;return types.SimpleNamespace(st_mode=self.mode,st_uid=501,st_size=self.size)
    def write(self,fd,raw):
        assert fd==41;self.writes.append(raw)
        if self.write_error:raise OSError('fake write refusal')
        return len(raw)-1 if self.partial else len(raw)
    def close(self,fd):
        assert fd==41;self.closes+=1
        if self.close_error:raise OSError('fake close refusal')
    def namespace(self,fixture=None):
        fixture=fixture or Fixture();ns=fixture.namespace();ns['ROOT']=Path('/fake-root');ns['PROBE_RECEIPT_MAX']=1048576
        import stat
        ns['stat']=stat
        for key,value in dict(O_WRONLY=1,O_CREAT=2,O_APPEND=4,O_NOFOLLOW=8,O_NONBLOCK=16,open=self.open,
            fstat=self.fstat,getuid=lambda:501,write=self.write,close=self.close).items():setattr(ns['os'],key,value)
        exec(compile(catalog_program,'<actual-append-receipt>','exec'),ns)
        return ns,fixture

def raw_size(value):return len((json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode())
def catalog_case(name,catalog,value,reserve=0,refused=False):
    ns,fixture=catalog.namespace();raised=False
    try:ns['append_probe_receipt'](value,reserve)
    except (ValueError,OSError):raised=True
    assert raised==refused
    assert catalog.closes==catalog.opens
    assert fixture.spawn_count==0
    return {'name':name,'state':'passed','open_count':catalog.opens,'write_count':len(catalog.writes),'close_count':catalog.closes}
base=raw_size({'payload':''});exact={'payload':'x'*(8192-base)};assert raw_size(exact)==8192
results.append(catalog_case('catalog-row8192-success',Catalog(),exact))
results.append(catalog_case('catalog-row8193-pre-open-refusal',Catalog(),{'payload':'x'*(8193-base)},refused=True))
value={'kind':'result','state':'success'};reserve=8192
results.append(catalog_case('catalog-1MiB-exact-reserved-boundary',Catalog(1048576-raw_size(value)-reserve),value,reserve))
fixture=Fixture();env={'PATH':'/fake-bin','TMPDIR':'/fake-tmp/'}
intent={'kind':'intent','id':'fake-owned-token','argv':['/fake'],'environment_keys':sorted(env),
    'environment_SHA256':hashlib.sha256(json.dumps(env,sort_keys=True).encode()).hexdigest(),
    'combined_maximum':8,'deadline_seconds':10,'saved_before_Popen':True}
catalog=Catalog(1048576-8192-raw_size(intent)+1);ns,fixture=catalog.namespace(fixture)
try:ns['probe'](['/fake'],env,8)
except ValueError:pass
else:raise AssertionError('catalog reserve overflow admitted spawn')
assert fixture.spawn_count==0 and catalog.opens==catalog.closes==1 and catalog.writes==[]
results.append({'name':'catalog-reserve-plus1-pre-spawn-refusal','state':'passed'})
results.append(catalog_case('catalog-partial-write-refusal-close',Catalog(partial=True),value,refused=True))
results.append(catalog_case('catalog-nonregular-refusal-close',Catalog(mode=0o010600),value,refused=True))
results.append(catalog_case('catalog-write-exception-close',Catalog(write_error=True),value,refused=True))
results.append(catalog_case('catalog-close-exception-refusal',Catalog(close_error=True),value,refused=True))

print(json.dumps({'kind':'AST-selected-functions-pure-fakes-only','guard_SHA256':EXPECTED,'total':len(results),'pass':len(results),'fail':0,
    'real_children_Git_Swift_SDK_Node_network_Hosted':0,'cases':results},sort_keys=True))
