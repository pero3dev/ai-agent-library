#!/usr/bin/env python3
"""Unadopted Hosted candidate: prepare frozen inputs, then one bounded host observation.
No caller-selected byte policy. --prepare and --run require reviewed same-repo CI.
"""
from pathlib import Path
from contextlib import contextmanager
import errno, hashlib, json, os, re, selectors, shutil, signal, stat, subprocess, sys, time, uuid, zlib, platform, plistlib
WORKSPACE = Path(__file__).resolve().parents[2]
ROOT = WORKSPACE / '.local/ios-core-notice-20261031'
NODE = Path(os.environ.get('CORE_NODE_BINARY', '/NONEXISTENT-NODE'))
DEVELOPER = Path('/Applications/Xcode_16.4.app/Contents/Developer')
SWIFTC = str(DEVELOPER/'Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc')
PROBE_OUTER_DEADLINE = None
PROBE_RECEIPT_MAX = 1048576
FIXTURE_ROOT = WORKSPACE / '.local/ios-core-notice-fixtures-20261031'
BOUNDARY_TEST_SHA256 = '43126d0daa63ceea3d6d520098b47b6c540c00283f70bd406b45a6d68212e712'
FIXTURE_LIMITS = {'seconds':30,'combined_bytes':1048576,'private_bytes':33554432,'floor_free':734003200}
FIXTURE_CASES = ['success-combined-exact-cap', 'empty-success', 'stdout-plus-one-refuses', 'stderr-plus-one-refuses', 'combined-overcap-refuses', 'nonzero-refuses', 'pipe-deadline-kill-reap', 'EOF-live-child-deadline-kill-reap', 'spawn-error-no-child', 'read-error-kill-reap', 'select-error-kill-reap', 'unreaped-refuses', 'probe-intent-result-success', 'probe-intent-result-refusal', 'outer-deadline-refuses-before-spawn', 'argv-bound-before-spawn', 'same-literal-env-and-selection-drift-visible', 'production-order-cap-removal-and-limited-trust-static', 'catalog-row8192-success', 'catalog-row8193-pre-open-refusal', 'catalog-1MiB-exact-reserved-boundary', 'catalog-reserve-plus1-pre-spawn-refusal', 'catalog-partial-write-refusal-close', 'catalog-nonregular-refusal-close', 'catalog-write-exception-close', 'catalog-close-exception-refusal']
GIT_TRUST = 'Fresh quiescent public Hosted macos-15 vendor tools/default selection are trusted; effective config and selected known aliases are rechecked, not exhaustive absence or exec authentication.'
LIMITS = {'seconds':180,'start_free':3800000000,'floor_free':3200000000,'private_bytes':268435456,'tree_RSS_bytes':1610612736,'outer_log_bytes':8388608}
INSTALLATION = {'core-performance-runner.mjs':'4276643f3c0df1e21d62f020c0ebd5ec32639b536fa6933806e7ad611edcaf5f',
'PublishedCoreBenchmark.swift':'92d8005e1d0fe98008e6deeff54773ee0866e0fb75c4b9dc80ce5507a03d71aa',
'core-performance-queries.json':'39995c2b75ba04eec4e1dc610b35c28b1b0f386cc5b250eaeab5211d13cfa31b',
'verify-core-performance.mjs':'15880ac76ec61af487d888684fa8910a5f74e74a43a717bb839442ce7fa30c51',
'verify-core-performance-notice-20261031.mjs':'c911db411741ddfa60af310a6d1906f565f3413375a6538655b29053a28d5784'}
SOURCES = {'ios/AILibrary/Sources/Models.swift':'459423194145e677834d35b57201ae60f0c9e9b5ab449a620cb519f5a070292c',
'ios/AILibrary/Sources/NativeDocument.swift':'ce96e4960eef766e325b1b4b7d3701d4a7d5b5c3b1e69ae9599fd0f2622af2ab',
'ios/AILibrary/Sources/ContentValidator.swift':'ffcdab90f0a8f39fc8b7cfceea0ba48aac7f18df1c033b237d2da311562e385a',
'ios/AILibrary/Sources/ReadingStore.swift':'da88bdb3ef99a93ddb842f53e7e92bdba2dfc4e95bff0f78f9d467387e9acfe7'}
QUERY_SOURCE='ios/AILibraryTests/SearchIndexTests.swift'
QUERY_SHA='3bb988b77a8d8da65ae3e401d092a3ff5cfdebbad73e11e99c5efd6fb8d98eb7'
PUBLISHED_SHA='4ba18c1b5d72fdd3acfdac32ece203a1d8c2a1bbf7c11fa9a0a4169c1feacaee'
BARE_CONFIG=b'[core]\n\trepositoryformatversion = 0\n\tbare = true\n\thooksPath = /dev/null\n\tlogallrefupdates = false\n'

def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def read(path, maximum=8388608):
    fd = os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode) and before.st_size <= maximum, 'Bounded regular input required')
        parts = []
        while True:
            block = os.read(fd,65536)
            if not block:
                break
            parts.append(block)
            require(sum(map(len,parts)) <= maximum, 'Input grew beyond bound')
        value = b''.join(parts)
        after = os.fstat(fd)
        require(len(value) == before.st_size and all(getattr(before,key) == getattr(after,key)
                for key in ['st_dev','st_ino','st_size','st_mtime_ns','st_ctime_ns']), 'Input changed during read')
        return value
    finally:
        os.close(fd)


def fingerprint(path):
    fd = os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode), 'Immutable leaf must be regular')
        h,count = hashlib.sha256(),0
        while True:
            block = os.read(fd,65536)
            if not block:
                break
            h.update(block)
            count += len(block)
        after = os.fstat(fd)
        require(count == before.st_size and all(getattr(before,key) == getattr(after,key)
                for key in ['st_dev','st_ino','st_size','st_mtime_ns','st_ctime_ns']), 'Immutable input changed')
        return {'path':str(path),'bytes':count,'sha256':h.hexdigest()}
    finally:
        os.close(fd)


def load(path):
    return json.loads(read(path))


def save(path,value):
    with path.open('x',encoding='utf-8') as handle:
        json.dump(value,handle,ensure_ascii=False,indent=2)
        handle.write('\n')


def private_inventory(directory):
    result = {}
    for current,dirs,files in os.walk(directory,followlinks=False):
        for name in dirs+files:
            item = Path(current)/name
            require(not item.is_symlink(), 'Immutable private input contains a link')
            info = item.lstat()
            require(stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode), 'Immutable special file rejected')
            if stat.S_ISREG(info.st_mode):
                result[str(item.relative_to(directory))] = {**fingerprint(item),'mode':format(stat.S_IMODE(info.st_mode),'04o')}
    return result


def validate_partial_git(revision,proof):
    git = ROOT/'prepared/git'
    require(read(git/'HEAD') == (revision+'\n').encode() and read(git/'config') == BARE_CONFIG,
            'Partial bare repository identity/config differs')
    for name in ['hooks','packed-refs','shallow','commondir','config.worktree','objects/info/alternates','objects/info/http-alternates']:
        require(not (git/name).exists() and not (git/name).is_symlink(), 'Unexpected Git bootstrap surface')
    require(not any((git/'refs').rglob('*')) and not any((git/'objects/pack').rglob('*')),
            'No refs, replace refs, packed/promisor objects are permitted')
    objects = set()
    def object_data(oid,kind):
        require(re.fullmatch(r'[a-f0-9]{40}',oid), 'Invalid object ID')
        packed = read(git/'objects'/oid[:2]/oid[2:])
        decoder = zlib.decompressobj()
        raw = decoder.decompress(packed,8388609)
        require(decoder.eof and not decoder.unused_data and len(raw) <= 8388608
                and hashlib.sha1(raw).hexdigest() == oid, 'Loose object size/hash rejected')
        header,data = raw.split(b'\0',1)
        require(header == kind.encode()+b' '+str(len(data)).encode(), 'Loose object type/size differs')
        objects.add(oid)
        return data
    commit = object_data(revision,'commit')
    match = re.match(rb'tree ([a-f0-9]{40})\n',commit)
    require(match is not None, 'Actual raw commit root tree missing')
    root_tree = match[1].decode()
    require(root_tree == proof['actual_root_tree'], 'Actual source root tree differs')
    tuples = {}
    def tree(oid,prefix):
        raw = object_data(oid,'tree')
        while raw:
            head,tail = raw.split(b'\0',1)
            mode,name = head.split(b' ',1)
            require(len(tail) >= 20 and name not in {b'.',b'..'} and b'/' not in name, 'Unsafe tree entry')
            child,raw = tail[:20].hex(),tail[20:]
            rel = prefix+name.decode('utf-8')
            if mode == b'40000':
                tree(child,rel+'/')
            else:
                require(mode in {b'100644',b'100755'} and rel not in tuples, 'Unexpected/duplicate blob tuple')
                tuples[rel] = (mode.decode(),'blob',child)
            require(len(tuples) <= 4096, 'Tree tuple bound')
    tree(root_tree,'')
    require(len(tuples) == proof['full_tree_tuple_count'] and 1 <= len(tuples) <= 10000, 'Expected exact Notice tree inventory')
    docs = {rel for rel in tuples if re.fullmatch(r'docs/\d{2}-[a-z0-9-]+/[a-z0-9-]+\.md',rel) and Path(rel).name.lower()!='readme.md'}
    required = set(SOURCES)|{QUERY_SOURCE}|docs
    require(set(proof['required_blob_paths']) == required, 'Missing/extra CLI-required blob closure')
    published = []
    for rel in sorted(required):
        data = object_data(tuples[rel][2],'blob')
        if rel in SOURCES:
            require(sha(data) == SOURCES[rel], 'New static Notice Source4 mismatch')
        elif rel == QUERY_SOURCE:
            require(sha(data) == QUERY_SHA, 'Revision query-source byte mismatch')
        else:
            text = data.decode('utf-8').replace('\r\n','\n').replace('\r','\n')
            front = re.match(r'^---\n([\s\S]*?)\n---(?:\n|$)',text)
            require(front is not None, 'Missing docs front matter')
            lines = [line for line in front[1].split('\n') if re.match(r'^status\s*:',line)]
            require(len(lines) == 1, 'Ambiguous docs status')
            status = re.fullmatch(r'''status: *(?:([a-z]+)|"([a-z]+)"|'([a-z]+)') *(?:#.*)?''',lines[0])
            require(status is not None, 'Unrecognized status grammar')
            value = next(group for group in status.groups() if group is not None)
            require(value in {'draft','published'}, 'Unsupported status')
            if value == 'published':
                published.append([rel,sha(data)])
    digest = sha((json.dumps(published,ensure_ascii=False,indent=2)+'\n').encode())
    require(len(published) == 199 and digest == PUBLISHED_SHA, 'Published docs199 digest changed')
    disk_objects = {a.name+b.name for a in (git/'objects').iterdir() if re.fullmatch(r'[a-f0-9]{2}',a.name)
                    for b in a.iterdir()}
    require(disk_objects == objects, 'Only commit/alltree/requiredblob loose objects may be present')
    allowed_files = {'HEAD','config'}|{'objects/'+oid[:2]+'/'+oid[2:] for oid in objects}
    require(set(private_inventory(git)) == allowed_files, 'Unexpected bare repository config/helper/index surface')
    return {'actual_commit':revision,'actual_root_tree':root_tree,'full_tree_tuples':len(tuples),
            'CLI_required_blobs':len(required),'stored_objects':len(objects),'published':199,
            'missing_nonrequired_blobs_intentional':True,'complete_clone':False}


@contextmanager
def owned_exclusive_lock(lock, token):
    """Release only the inode and exact token bytes this acquisition published.

    A returned short write is a failed publication with a known exact prefix.
    Unexpected contents or replacement are retained, never treated as our lock.
    Path checks are fail-closed observations, not atomic conditional unlink.
    """
    payload = (token+'\n').encode()
    identity = None
    published = b''
    lock_fd = os.open(lock,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    try:
        info = os.fstat(lock_fd)
        identity = (info.st_dev,info.st_ino)
        require(stat.S_ISREG(info.st_mode) and info.st_size == 0, 'New owned lock must be empty/regular')
        written = os.write(lock_fd,payload)
        require(type(written) is int and 0 <= written <= len(payload), 'Invalid lock token write result')
        published = payload[:written]
        require(written == len(payload), 'Short lock token write; no work admitted')
        os.close(lock_fd)
        lock_fd = None
        yield
    finally:
        try:
            if lock_fd is not None:
                # No new descriptor is opened between a failed close and this
                # check. EBADF means close succeeded before reporting failure.
                try:
                    current = os.fstat(lock_fd)
                except OSError as error:
                    if error.errno != errno.EBADF:
                        try:
                            os.close(lock_fd)
                        finally:
                            raise
                else:
                    if identity is None:
                        identity = (current.st_dev,current.st_ino)
                    require((current.st_dev,current.st_ino) == identity, 'Lock descriptor ownership changed')
                    os.close(lock_fd)
        finally:
            if identity is not None:
                try:
                    check_fd = os.open(lock,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
                except FileNotFoundError:
                    pass
                else:
                    try:
                        before = os.fstat(check_fd)
                        require((before.st_dev,before.st_ino) == identity and stat.S_ISREG(before.st_mode),
                                'Lock inode replaced; retain uncertain lock')
                        value = os.read(check_fd,len(payload)+1)
                        after = os.fstat(check_fd)
                        require(all(getattr(before,key) == getattr(after,key) for key in
                                    ['st_dev','st_ino','st_size','st_mtime_ns','st_ctime_ns'])
                                and len(value) == before.st_size and value == published,
                                'Lock token changed; retain uncertain lock')
                        actual = lock.lstat()
                        require(all(getattr(actual,key) == getattr(after,key) for key in
                                    ['st_dev','st_ino','st_size','st_mtime_ns','st_ctime_ns']),
                                'Lock path changed; retain uncertain lock')
                        lock.unlink()
                    finally:
                        os.close(check_fd)


def process_rows():
    stdout,stderr,receipt=bounded_metadata(['/bin/ps','-axo','pid=,ppid=,pgid=,rss=,lstart='],
        {'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C'},1048576,metadata_seconds(3))
    require(receipt['state']=='success','Bounded ps observation failed')
    rows = {}
    for line in stdout.decode().splitlines():
        fields = line.split(None,4)
        if len(fields) == 5:
            pid,ppid,pgid,rss = map(int,fields[:4])
            rows[pid] = {'pid':pid,'ppid':ppid,'pgid':pgid,'rss':rss*1024,'start':fields[4]}
    return rows



def event_binding():
    require(os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_REPOSITORY')=='pero3dev/ai-agent-library','Only fixed public repository CI admitted')
    require(os.environ.get('GITHUB_RUN_ATTEMPT')=='1','No workflow rerun measurement')
    require(Path(os.environ['GITHUB_WORKSPACE']).resolve()==WORKSPACE and WORKSPACE.is_dir(),'Workspace mismatch')
    event=load(Path(os.environ['GITHUB_EVENT_PATH']));require(event['repository']['full_name']=='pero3dev/ai-agent-library' and event['repository']['private'] is False,'Repository binding differs')
    kind=os.environ['GITHUB_EVENT_NAME']
    if kind=='pull_request':
        pr=event['pull_request'];require(pr['head']['repo']['full_name']==pr['base']['repo']['full_name']=='pero3dev/ai-agent-library','Fork/base repository rejected');expected=pr['head']['sha']
    else:
        require(kind=='workflow_dispatch','Unsupported event');expected=os.environ['GITHUB_SHA']
    require(re.fullmatch(r'[a-f0-9]{40}',expected) and expected==os.environ.get('EXPECTED_SOURCE_HEAD'),'Expected exact source40 differs')
    require(NODE.is_absolute() and NODE.is_file() and not NODE.is_symlink(),'Explicit regular setup-node binary required')
    return expected

def child_env(tmp):
    # This is the producer child's actual allowed environment, not assumed GIT_* forwarding.
    return {'PATH':str(NODE.parent)+':/usr/bin:/bin:/usr/sbin:/sbin','TMPDIR':str(tmp)+'/'}

def bounded_metadata(argv, env, maximum, seconds, monitor=None):
    """One direct session child; bounded combined retention, elapsed deadline and reap.
    No process-table scan or claim that every unobserved descendant is terminated.
    """
    require(type(maximum) is int and 0 < maximum <= 8388608 and 0 < seconds <= 30,
            'Fixed metadata bounds required')
    require(isinstance(argv,list) and 0 < len(argv) <= 32 and all(isinstance(x,str) and len(x) <= 512 for x in argv)
            and sum(map(len,argv)) <= 4096, 'Bounded metadata argv required')
    started=time.monotonic();deadline=started+seconds
    buffers={'stdout':bytearray(),'stderr':bytearray()};observed={'stdout':0,'stderr':0}
    child=None;selector=None;reaped=False;reason=None;cleanup_errors=[]
    try:
        if monitor is not None:monitor()
        child=subprocess.Popen(argv,cwd=WORKSPACE,env=env,stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
        selector=selectors.DefaultSelector()
        for name in ['stdout','stderr']:
            stream=getattr(child,name);os.set_blocking(stream.fileno(),False)
            selector.register(stream,selectors.EVENT_READ,name)
        while selector.get_map():
            if monitor is not None:monitor()
            remaining=deadline-time.monotonic()
            if remaining <= 0:reason='deadline';raise TimeoutError('Metadata deadline')
            for event,_ in selector.select(min(0.1,remaining)):
                if time.monotonic() >= deadline:reason='deadline';raise TimeoutError('Metadata deadline')
                # Read at most cap+1 total: detect an excess without retaining it.
                available=maximum-sum(map(len,buffers.values()))
                block=os.read(event.fd,min(65536,available+1))
                if not block:selector.unregister(event.fileobj);continue
                observed[event.data]+=len(block)
                buffers[event.data].extend(block[:available])
                if len(block)>available:reason='combined-output-cap';raise ValueError('Metadata combined cap')
        while not reaped:
            if monitor is not None:monitor()
            remaining=deadline-time.monotonic()
            if remaining <= 0:reason='deadline';raise TimeoutError('Metadata deadline')
            try:child.wait(timeout=min(0.1,remaining));reaped=True
            except subprocess.TimeoutExpired:continue
        if monitor is not None:monitor()
        if child.returncode != 0:reason='nonzero-exit'
    except BaseException as error:
        reason=reason or 'exception-'+type(error).__name__
    finally:
        if child is not None:
            if not reaped:
                # Popen's own unreaped start_new_session PID cannot have been reused.
                try:os.killpg(child.pid,signal.SIGKILL)
                except ProcessLookupError:pass
                except BaseException as error:cleanup_errors.append('kill-'+type(error).__name__)
                try:child.wait(timeout=3);reaped=True
                except BaseException as error:cleanup_errors.append('wait-'+type(error).__name__)
            if selector is not None:selector.close()
            for stream in [child.stdout,child.stderr]:
                if stream is not None:
                    try:stream.close()
                    except BaseException as error:cleanup_errors.append('close-'+type(error).__name__)
    receipt={'state':'success' if reason is None and reaped and not cleanup_errors else 'refused',
        'reason':reason,'PID':None if child is None else child.pid,
        'exit_code':None if child is None else child.returncode,'direct_child_reaped':reaped,
        'cleanup_errors':cleanup_errors,'seconds':time.monotonic()-started,'deadline_seconds':seconds,
        'combined_maximum':maximum,'observed_bytes':observed,
        'retained_bytes':{k:len(v) for k,v in buffers.items()},
        'retained_SHA256':{k:sha(v) for k,v in buffers.items()},
        'truncated':reason=='combined-output-cap','descendant_census_performed':False}
    return bytes(buffers['stdout']),bytes(buffers['stderr']),receipt


def metadata_seconds(requested):
    remaining=requested if PROBE_OUTER_DEADLINE is None else min(requested,PROBE_OUTER_DEADLINE-time.monotonic())
    require(remaining>0,'Outer deadline before metadata spawn')
    return remaining


def append_probe_receipt(value, reserve=0):
    raw=(json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode()
    require(len(raw)<=8192,'Bounded metadata receipt required')
    fd=os.open(ROOT/'probe-receipts.jsonl',os.O_WRONLY|os.O_CREAT|os.O_APPEND|os.O_NOFOLLOW|os.O_NONBLOCK,0o600)
    try:
        info=os.fstat(fd)
        require(stat.S_ISREG(info.st_mode) and info.st_uid==os.getuid()
                and info.st_size+len(raw)+reserve<=PROBE_RECEIPT_MAX,'Metadata receipt catalog cap')
        require(os.write(fd,raw)==len(raw),'Incomplete metadata receipt')
    finally:os.close(fd)


def probe(argv, env, maximum=8388608):
    seconds=metadata_seconds(10);token=str(uuid.uuid4())
    # Validate before saving argv; no raw config or output is written to receipts.
    require(isinstance(argv,list) and 0<len(argv)<=32 and all(isinstance(x,str) and len(x)<=512 for x in argv)
            and sum(map(len,argv))<=4096,'Bounded metadata argv required')
    append_probe_receipt({'kind':'intent','id':token,'argv':argv,'environment_keys':sorted(env),
        'environment_SHA256':sha(json.dumps(env,sort_keys=True).encode()),'combined_maximum':maximum,
        'deadline_seconds':seconds,'saved_before_Popen':True},reserve=8192)
    stdout,stderr,receipt=bounded_metadata(argv,env,maximum,seconds)
    append_probe_receipt({'kind':'result','id':token,**receipt})
    require(receipt['state']=='success','Bounded metadata command refused: '+str(receipt['reason']))
    return stdout


def git_selection(env):
    version=probe(['/usr/bin/git','--version'],env).decode().strip()
    request=probe(['/usr/bin/git','--exec-path'],env).decode().strip()
    require(re.fullmatch(r'/Applications/Xcode_[0-9]+(?:\.[0-9]+)*\.app/Contents/Developer/usr/libexec/git-core',request)
            and len(request)<=192,'Standard selected Xcode Git exec path required')
    exec_path=Path(request);developer=exec_path.parents[2]
    require(exec_path.is_dir() and not exec_path.is_symlink() and exec_path.resolve()==exec_path,
            'Canonical selected Xcode Git exec path required')
    backend=developer/'usr/bin/git'
    require(backend.is_file() and not backend.is_symlink() and backend.resolve()==backend,
            'Canonical matching Xcode Git backend required')
    require(probe([str(backend),'--version'],env).decode().strip()==version,'Git shim/backend version mismatch')
    alias=Path('/var/db/xcode_select_link')
    if alias.is_symlink():selected={'present':True,'link':os.readlink(alias),'resolved':str(alias.resolve())}
    else:
        require(not alias.exists(),'Unknown Xcode selector type')
        selected={'present':False}
    require(selected['present'] and selected['resolved']==str(developer),'Selected Git backend and known Xcode selector differ')
    return {'version':version,'exec_path':str(exec_path),'backend':str(backend),
        'git_shim':fingerprint(Path('/usr/bin/git')),'git_backend':fingerprint(backend),
        'known_xcode_selector':selected,'selected_xcode_developer':str(developer),
        'fixed_xcode_vendor_origin':'file:'+str(developer/'usr/share/git-core/gitconfig'),
        'trust_premise':GIT_TRUST}


def runtime_git_boundary(env):
    selection=git_selection(env)
    return {'environment':env,'owned_store':git_audit(ROOT/'prepared/git',env,True,selection),
        'source_checkout':git_audit(WORKSPACE,env,False,selection),'selection':selection}


def save_git_surface_rejection(g, first_rejected_rel):
    # Metadata only, after the original rejection predicate. Never open leaf contents.
    rels = ['info/grafts','objects/info/alternates','objects/info/http-alternates',
            'refs/replace','config.worktree','commondir']
    require(first_rejected_rel in rels, 'Fixed Git diagnostic surface required')
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_NONBLOCK
    try:
        anchor = os.open(g, flags)
        try:
            def metadata(rel):
                row = {'rel':rel,'kind':None,'stat_size':None,'regular_empty':None,'errno':None}
                opened = []
                parent = anchor
                try:
                    for part in rel.split('/')[:-1]:
                        item = os.stat(part, dir_fd=parent, follow_symlinks=False)
                        if not stat.S_ISDIR(item.st_mode):
                            row['kind'] = 'blocked-parent-symlink' if stat.S_ISLNK(item.st_mode) else 'blocked-parent-nondirectory'
                            return row
                        parent = os.open(part, flags, dir_fd=parent)
                        opened.append(parent)
                    item = os.stat(rel.split('/')[-1], dir_fd=parent, follow_symlinks=False)
                    row['stat_size'] = item.st_size
                    if stat.S_ISREG(item.st_mode):
                        row['kind'] = 'regular'
                        row['regular_empty'] = item.st_size == 0
                    elif stat.S_ISDIR(item.st_mode):
                        row['kind'] = 'directory'
                    elif stat.S_ISLNK(item.st_mode):
                        row['kind'] = 'symlink'
                    else:
                        row['kind'] = 'other'
                    return row
                except OSError as error:
                    row['kind'] = 'absent' if error.errno == errno.ENOENT else 'stat-error'
                    row['errno'] = error.errno if isinstance(error.errno, int) else None
                    return row
                finally:
                    close_failed = False
                    for descriptor in reversed(opened):
                        try:
                            os.close(descriptor)
                        except OSError:
                            close_failed = True
                    require(not close_failed, 'Git diagnostic directory close refused')
            rows = [metadata(rel) for rel in rels]
        finally:
            os.close(anchor)
        value = {'kind':'rejected-Git-surface-metadata-only','first_rejected_rel':first_rejected_rel,
                 'non_atomic_snapshot':True,'diagnostic_does_not_override_rejection':True,'rows':rows}
        data = (json.dumps(value, sort_keys=True, separators=(',',':'))+'\n').encode('utf-8')
        require(len(data) <= 4096, 'Git diagnostic4KiB refused')
        output_dir = os.open(ROOT, flags)
        try:
            output = os.open('git-surface-rejection.json',
                os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_NONBLOCK,
                0o600, dir_fd=output_dir)
            try:
                position = 0
                while position < len(data):
                    count = os.write(output, data[position:])
                    require(0 < count <= len(data)-position, 'Git diagnostic write refused')
                    position += count
            finally:
                os.close(output)
        finally:
            os.close(output_dir)
    except Exception:
        # Keep filenames, config values and raw OS errors out of stopped.json.
        raise ValueError('Git surface rejection diagnostics failed') from None


def inert_worktree_file_metadata(g):
    # Metadata only: never open, read, or hash config.worktree contents.
    try:
        anchor = os.open(g, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_NONBLOCK)
        try:
            item = os.stat('config.worktree', dir_fd=anchor, follow_symlinks=False)
        finally:
            os.close(anchor)
    except OSError:
        raise ValueError('Inert worktree metadata unavailable') from None
    require(stat.S_ISREG(item.st_mode) and item.st_nlink == 1 and 0 <= item.st_size <= 4096,
            'Inert worktree metadata refused')
    return {'present':True,'kind':'regular','stat_size':item.st_size,'nlink':item.st_nlink,
            'inert_condition':False}


def without_canonical_empty_extensions(config):
    # Inspection string only. The original file is never rewritten.
    remainder = []
    inside = False
    for raw_line in config.splitlines(keepends=True):
        line = raw_line[:-1] if raw_line.endswith('\n') else raw_line
        if inside:
            if re.fullmatch(r'[ \t]*(?:[#;][^\r\n]*)?', line):
                remainder.append(raw_line)
                continue
            require(re.match(r'[ \t]*\[', line) is not None,
                    'Only canonical empty extensions sections permitted')
            inside = False
        if line == '[extensions]':
            inside = True
            remainder.append('\n' if raw_line.endswith('\n') else '')
        else:
            remainder.append(raw_line)
    return ''.join(remainder)


def save_git_config_rejection_shape(raw, repo, g, bare, rejected_row_index):
    # Rejection-only labels. None of these categories or presets grants permission.
    known_keys = {'core.repositoryformatversion','core.filemode','core.bare','core.logallrefupdates',
        'core.ignorecase','core.precomposeunicode','core.hookspath','gc.auto','remote.origin.url',
        'remote.origin.fetch','credential.helper','filter.lfs.clean','filter.lfs.smudge',
        'filter.lfs.process','filter.lfs.required','init.defaultbranch','safe.directory',
        'extensions.worktreeconfig'}
    groups = {'credential','filter','extensions','include','http','url','remote'}
    presets = {('credential.helper','osxkeychain'):'credential-osxkeychain',
        ('filter.lfs.clean','git-lfs clean -- %f'):'lfs-clean-default',
        ('filter.lfs.smudge','git-lfs smudge -- %f'):'lfs-smudge-default',
        ('filter.lfs.process','git-lfs filter-process'):'lfs-process-default',
        ('filter.lfs.required','true'):'lfs-required-true',
        ('init.defaultbranch','main'):'init-main'}
    def origin_label(origin):
        if origin.startswith('file:'):
            value = origin[5:]
            relative = {'config','./config'} if bare else {'.git/config','./.git/config'}
            if value == str(g/'config') or value in relative:return 'own-main-config'
            if value == '/etc/gitconfig':return 'etc-gitconfig'
            if value == '/usr/local/etc/gitconfig':return 'usr-local-etc-gitconfig'
            suffix = r'(?:usr/share/git-core|usr/etc|etc)/gitconfig'
            if re.fullmatch(r'/Applications/Xcode[A-Za-z0-9_.-]{0,48}\.app/Contents/Developer/'+suffix,value):
                return 'xcode-vendor-config'
            if re.fullmatch(r'/Library/Developer/CommandLineTools/'+suffix,value):
                return 'clt-vendor-config'
            return 'other-file'
        if origin == 'command line:':return 'command-origin'
        if origin == 'standard input:':return 'standard-input'
        if origin.startswith('blob:'):return 'blob-origin'
        return 'other-origin'
    value = {'kind':'rejected-Git-effective-config-shape','schema':1,
        'diagnostic_does_not_override_rejection':True,'audit_scope':'owned-store' if bare else 'source-checkout',
        'failure_context':'existing-effective-config-row-validation','complete':False,
        'stdout_bytes':len(raw),'row_count':None,'row_count_at_least':0,
        'rejected_row_index':rejected_row_index,'truncated':False,'parse_error':None,
        'columns':['scope','origin','key','value_type','value_length','known_literal','safe_directory_is_own_repo'],
        'rows':[]}
    require(rejected_row_index is None or type(rejected_row_index) is int and rejected_row_index >= 0,
            'Fixed Git diagnostic row context required')
    if len(raw) > 8192:
        value.update(parse_error='input-limit',truncated=True)
    else:
        try:
            lines = raw.decode('utf-8').splitlines()
        except UnicodeDecodeError:
            value['parse_error'] = 'utf8'
        else:
            if len(lines) > 32:
                value.update(parse_error='row-limit',row_count_at_least=33,truncated=True)
            else:
                value.update(row_count=len(lines),row_count_at_least=len(lines),complete=True)
                for line in lines:
                    fields = line.split('\t')
                    if len(fields) != 3:
                        value['rows'].append(['malformed'])
                        value.update(complete=False,parse_error=value['parse_error'] or 'field-count')
                        continue
                    scope,origin,pair = fields
                    key,separator,contents = pair.partition('=')
                    if not separator:
                        value['rows'].append(['malformed'])
                        value.update(complete=False,parse_error=value['parse_error'] or 'missing-equals')
                        continue
                    key = key.lower()
                    group = key.split('.',1)[0]
                    label = key if key in known_keys else 'group:'+(group if group in groups else 'other')
                    if not contents:kind = 'empty'
                    elif any(ord(char)<32 or ord(char)==127 for char in contents):kind = 'control'
                    elif all(32<=ord(char)<=126 for char in contents):kind = 'ascii-printable'
                    else:kind = 'nonascii'
                    value['rows'].append([
                        scope if scope in {'system','global','local','worktree','command','unknown'} else 'unrecognized',
                        origin_label(origin),label,kind,len(contents),presets.get((key,contents)),
                        contents == str(repo) if key == 'safe.directory' else None])
    data = (json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode('ascii')
    if len(data) > 4096:
        value.update(complete=False,parse_error='report-limit',truncated=True,rows=[])
        data = (json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode('ascii')
    require(len(data) <= 4096, 'Git rejection shape4KiB refused')
    directory = os.open(ROOT,os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        output = os.open('git-config-rejection-shape.json',
            os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_NONBLOCK,
            0o600,dir_fd=directory)
        try:
            position = 0
            while position < len(data):
                count = os.write(output,data[position:])
                require(0 < count <= len(data)-position, 'Git rejection shape write refused')
                position += count
        finally:
            os.close(output)
    finally:
        os.close(directory)


def git_audit(repo, env, bare, selection):
    g=repo if bare else repo/'.git'
    require(g.is_dir() and not g.is_symlink(),'Ordinary Git directory required')
    worktree_metadata = None
    for rel in ['info/grafts','objects/info/alternates','objects/info/http-alternates','refs/replace','config.worktree','commondir']:
        q=g/rel;absent=not q.exists() and not q.is_symlink()
        if not absent and rel == 'config.worktree' and not bare:
            try:
                worktree_metadata = inert_worktree_file_metadata(g)
            except Exception:
                save_git_surface_rejection(g,rel)
                raise ValueError('Inert worktree metadata refused') from None
        else:
            if not absent:save_git_surface_rejection(g,rel)
            require(absent,'Git replacement/alternate/worktree surface rejected')
    for q in (g/'objects/pack').glob('*.promisor'):raise ValueError('Promisor rejected')
    config=read(g/'config').decode('utf-8')
    inspected_config = without_canonical_empty_extensions(config) if worktree_metadata is not None else config
    require(not re.search(r'(?im)^\s*\[\s*(include|includeif|extensions|credential|filter|http|url)\b',inspected_config),'External Git configuration rejected')
    if (g/'hooks').exists():
        for q in (g/'hooks').iterdir():require(q.is_file() and not q.is_symlink() and q.name.endswith('.sample'),'Active Git hook rejected')
    raw=probe(['/usr/bin/git','-C',str(repo),'config','--show-origin','--show-scope','--list'],env)
    rows=[];local_rows=[];vendor_rows=[]
    vendor_origin=selection['fixed_xcode_vendor_origin']
    vendor_presets={'credential.helper':'osxkeychain','init.defaultbranch':'main'}
    vendor_seen=set()
    rejected_row_index = None
    try:
        for rejected_row_index,line in enumerate(raw.decode('utf-8').splitlines()):
            fields=line.split('\t');require(len(fields)==3,'Unknown Git config serialization')
            scope,origin,pair=fields
            if scope=='unknown' and origin==vendor_origin:
                key,sep,value=pair.partition('=')
                require(sep and key in vendor_presets and value==vendor_presets[key] and key not in vendor_seen,
                        'Fixed Xcode vendor preset differs or duplicates')
                vendor_seen.add(key)
                row={'scope':scope,'origin':origin,'key':key,'value':value}
                vendor_rows.append(row);rows.append(row)
                continue
            require(scope=='local' and origin.startswith('file:'),'Nonowned system/global/config origin rejected')
            origin_path=Path(origin[5:]);origin_path=origin_path if origin_path.is_absolute() else repo/origin_path
            require(origin_path.resolve()==(g/'config').resolve(),'Unexpected local config origin')
            key,sep,value=pair.partition('=');require(sep and not any(ord(x)<32 for x in value),'Unknown Git config value')
            key=key.lower()
            if bare:
                allowed={'core.repositoryformatversion':'0','core.bare':'true','core.hookspath':'/dev/null','core.logallrefupdates':'false'}
                require(key in allowed and value==allowed[key],'Owned bare effective config differs')
            else:
                allowed={'core.repositoryformatversion':{'0'},'core.filemode':{'true','false'},'core.bare':{'false'},'core.logallrefupdates':{'true'},'core.ignorecase':{'true','false'},'core.precomposeunicode':{'true','false'},'gc.auto':{'0'},'remote.origin.url':{'https://github.com/pero3dev/ai-agent-library','https://github.com/pero3dev/ai-agent-library.git'},'remote.origin.fetch':{'+refs/heads/*:refs/remotes/origin/*'}}
                require(key in allowed and value in allowed[key],'Unexpected fresh checkout Git config key/value')
            row={'scope':scope,'origin':origin,'key':key,'value':value}
            local_rows.append(row);rows.append(row)
        rejected_row_index = None
        require(vendor_seen==set(vendor_presets) and len(vendor_rows)==2,'Exactly two fixed Xcode vendor presets required')
        if bare:require(len(local_rows)==4,'Owned config missing/duplicate fields')
    except Exception:
        try:
            save_git_config_rejection_shape(raw,repo,g,bare,rejected_row_index)
        except BaseException:
            pass  # Diagnostic failure cannot mask the original enforcement exception.
        raise
    # Unexpected raw config values are never written to artifacts.
    # Only after owned-local and exact selected-Xcode preset audits pass is the file condition inert.
    if worktree_metadata is not None:
        worktree_metadata['inert_condition'] = True
    return {'exact_env_keys':['PATH','TMPDIR'],'effective_config_scope':'owned-local-plus-fixed-selected-Xcode-presets',
            'rows':rows,'local_rows':local_rows,'fixed_xcode_vendor_rows':vendor_rows,
            'raw_bytes':len(raw),'raw_sha256':sha(raw),
            'config_worktree':worktree_metadata or {'present':False,'inert_condition':False}}

def git_object(repo, oid, kind, env):
    require(re.fullmatch(r'[a-f0-9]{40}',oid) and kind in {'commit','tree','blob'},'Invalid object request')
    data=probe(['/usr/bin/git','-C',str(repo),'cat-file',kind,oid],env)
    canonical=kind.encode()+b' '+str(len(data)).encode()+b'\0'+data
    require(hashlib.sha1(canonical).hexdigest()==oid,'Raw Git object hash differs')
    return data

def ordinary_copy(source,destination):
    require(source.is_dir() and not source.is_symlink() and str(source.resolve())==str(source),'Canonical corpus required')
    rows=private_inventory(source);require(len(rows)==626 and sum(r['bytes']for r in rows.values())<=256*1024*1024,'Exact full Content626 required')
    destination.mkdir(mode=0o700)
    for rel,row in rows.items():
        f=destination/rel;f.parent.mkdir(parents=True,exist_ok=True)
        with f.open('xb')as handle:handle.write(read(source/rel,16*1024*1024))
        os.chmod(f,int(row['mode'],8));actual=fingerprint(f);require(actual['bytes']==row['bytes'] and actual['sha256']==row['sha256'],'Corpus copy differs')
    after=private_inventory(source);require(after==rows,'Corpus changed during preparation')
    return rows

def fixture_inputs():
    fixture=WORKSPACE/'ios/tests/hosted-core-notice-pure-fixtures-20261031.py'
    return {'guard':fingerprint(Path(__file__)),'fixture':fingerprint(fixture),
        'workflow':fingerprint(WORKSPACE/'.github/workflows/ios-core-notice-observation.yml'),
        'entry':fingerprint(WORKSPACE/'ios/tests/verify-core-performance-notice-20261031.mjs'),
        'boundary_test':fingerprint(WORKSPACE/'tests/unit/ios-core-performance-notice-20261031.test.mjs')}


def require_fixture_passage(revision):
    require(FIXTURE_ROOT.is_dir() and not FIXTURE_ROOT.is_symlink(),'First successful Hosted fixture stage required')
    receipt=load(FIXTURE_ROOT/'receipt.json')
    require(receipt['state']=='accepted-pure-fixture-gate' and receipt['source_head']==revision
        and receipt['limits']==FIXTURE_LIMITS and receipt['input_files']==fixture_inputs(),
        'Fixture source/head/limits/result differs')
    require(receipt['actual_cases']==26 and receipt['actual_unique_names']==sorted(FIXTURE_CASES)
        and receipt['child']['state']=='success' and receipt['child']['direct_child_reaped']
        and receipt['child']['exit_code']==0 and not receipt['child']['cleanup_errors'],
        'Exact26 passing pure fixtures and child cleanup required')
    require([x['name'] for x in receipt['Node_preflight']]==['node22-version','workflow-schema','entry-syntax','boundary-test-syntax']
        and all(x['child']['state']=='success' and x['child']['exit_code']==0 and x['child']['direct_child_reaped']
            and not x['child']['cleanup_errors'] for x in receipt['Node_preflight']),
        'Separate actual Node22 syntax/schema preflight required')
    raw_names={name+'.'+stream+'.log' for name in ['node22-version','workflow-schema','entry-syntax','boundary-test-syntax','python26'] for stream in ['stdout','stderr']}
    require(len(receipt['raw_files'])==10 and {x['file'] for x in receipt['raw_files']}==raw_names,'All10 unique Node/Python raw streams required')
    require(0<=receipt['seconds']<=FIXTURE_LIMITS['seconds'] and receipt['combined_output_bytes']<=FIXTURE_LIMITS['combined_bytes']
        and receipt['minimum_sampled_free']>=FIXTURE_LIMITS['floor_free']
        and receipt['maximum_sampled_private']<=FIXTURE_LIMITS['private_bytes'],'Fixture saved resource bounds refused')
    for row in receipt['raw_files']:
        data=read(FIXTURE_ROOT/row['file'],1048576)
        require({'bytes':len(data),'sha256':sha(data)}=={k:row[k] for k in ['bytes','sha256']},'Fixture raw changed')
    return receipt


def fixture_gate():
    revision=event_binding();started=time.monotonic();deadline=started+FIXTURE_LIMITS['seconds']
    require(read(WORKSPACE/'.git/HEAD').strip()==revision.encode(),'Fixture checkout must be detached exact head40')
    require(not FIXTURE_ROOT.exists() and not FIXTURE_ROOT.is_symlink(),'One new owned fixture root only')
    parent=FIXTURE_ROOT.parent;parent.mkdir(exist_ok=True)
    require(not parent.is_symlink() and parent.resolve()==parent,'Canonical .local owner required')
    require(shutil.disk_usage(parent).free>=FIXTURE_LIMITS['floor_free'],'Fixture700MiB start floor refused')
    FIXTURE_ROOT.mkdir(mode=0o700)
    for name in ['home','tmp']:(FIXTURE_ROOT/name).mkdir(mode=0o700)
    inputs=fixture_inputs();samples=[];raw_files=[];preflight=[];combined=0
    require(inputs['entry']['sha256']==INSTALLATION['verify-core-performance-notice-20261031.mjs']
        and inputs['boundary_test']['sha256']==BOUNDARY_TEST_SHA256,'Unchanged fixed Notice Source2 required')
    env={'PATH':str(NODE.parent)+':/usr/bin:/bin','LANG':'C','LC_ALL':'C','HOME':str(FIXTURE_ROOT/'home'),'TMPDIR':str(FIXTURE_ROOT/'tmp')+'/'}
    schema="""import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';const {load,JSON_SCHEMA}=await import(pathToFileURL(createRequire(process.cwd()+'/package.json').resolve('js-yaml')).href);
const w=load(fs.readFileSync('.github/workflows/ios-core-notice-observation.yml','utf8'),{schema:JSON_SCHEMA});
assert.deepEqual(Object.keys(w.on).sort(),['pull_request','workflow_dispatch']);
assert.deepEqual([...w.on.pull_request.paths].sort(),['.github/workflows/ios-core-notice-observation.yml','ios/tests/observe-core-notice-hosted-20261031.py','ios/tests/hosted-core-notice-pure-fixtures-20261031.py','ios/tests/verify-core-performance-notice-20261031.mjs','tests/unit/ios-core-performance-notice-20261031.test.mjs'].sort());
assert.deepEqual(w.permissions,{contents:'read'});assert.equal(w.concurrency['cancel-in-progress'],false);
const j=w.jobs.observe;assert.equal(j['runs-on'],'macos-15');assert.equal(j['timeout-minutes'],35);
const steps=j.steps;const find=flag=>steps.findIndex(s=>s.run?.includes('observe-core-notice-hosted-20261031.py '+flag));
assert(find('--fixtures')>=0&&find('--fixtures')<find('--prepare')&&find('--prepare')<find('--run'));
assert.equal(steps[find('--fixtures')]['timeout-minutes'],1);assert(!steps.some(s=>s['continue-on-error']));
assert(!steps[find('--prepare')].if&&!steps[find('--run')].if);assert.equal(steps.at(-1).if,'always()');
assert(steps.filter(s=>s.uses).every(s=>/@[a-f0-9]{40}$/.test(s.uses)));
console.log(JSON.stringify({state:'workflow-schema-accepted',Node_version:process.version,paths:5}));"""
    commands=[('node22-version',[str(NODE),'--version']),('workflow-schema',[str(NODE),'--input-type=module','-e',schema]),
        ('entry-syntax',[str(NODE),'--check',inputs['entry']['path']]),
        ('boundary-test-syntax',[str(NODE),'--check',inputs['boundary_test']['path']])]
    # Keep the fixed schema source in an owned file rather than an oversized -e argument.
    schema_path=FIXTURE_ROOT/'workflow-schema.mjs'
    with schema_path.open('x') as handle:handle.write(schema)
    commands[1]=('workflow-schema',[str(NODE),str(schema_path)])
    python_argv=[sys.executable,'-I','-B',inputs['fixture']['path']]
    save(FIXTURE_ROOT/'intent.json',{'source_head':revision,'Node_preflight':commands,'Python_argv':python_argv,
        'environment':env,'limits':FIXTURE_LIMITS,'input_files':inputs,'saved_before_Popen':True,
        'scope':'Node22 syntax/schema plus26 pure AST fake cases; no Core measurement'})
    def monitor():
        logical=allocated=entries=0
        for current,dirs,files in os.walk(FIXTURE_ROOT,followlinks=False):
            for name in dirs+files:
                info=(Path(current)/name).lstat();entries+=1
                require(stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode),'Fixture output type refused')
                allocated+=info.st_blocks*512;logical+=0 if stat.S_ISDIR(info.st_mode) else info.st_size
        sample={'free':shutil.disk_usage(FIXTURE_ROOT).free,'private_allocated':allocated,'private_logical':logical,'entries':entries}
        samples.append(sample)
        require(time.monotonic()<deadline and len(samples)<=4096 and entries<=1024
            and max(allocated,logical)<=FIXTURE_LIMITS['private_bytes'] and sample['free']>=FIXTURE_LIMITS['floor_free'],
            'Fixture sampled time/resource bound')
    def capture(name,argv):
        nonlocal combined
        monitor();remaining=deadline-time.monotonic();available=FIXTURE_LIMITS['combined_bytes']-combined
        require(remaining>0 and available>0,'No remaining fixture time/output before spawn')
        stdout,stderr,child=bounded_metadata(argv,env,available,min(30 if name=='python26' else 10,remaining),monitor)
        combined+=len(stdout)+len(stderr)
        for stream,data in [('stdout',stdout),('stderr',stderr)]:
            filename=name+'.'+stream+'.log'
            with (FIXTURE_ROOT/filename).open('xb') as handle:handle.write(data)
            raw_files.append({'file':filename,'bytes':len(data),'sha256':sha(data)})
        return stdout,stderr,child
    accepted=False;failure=None;names=[];child=None
    try:
        for name,argv in commands:
            stdout,stderr,outcome=capture(name,argv);preflight.append({'name':name,'child':outcome})
            require(outcome['state']=='success','Node syntax/schema child refused')
            if name=='node22-version':require(re.fullmatch(rb'v22\.\d+\.\d+\s*',stdout),'Node22 required')
            if name=='workflow-schema':require(json.loads(stdout)['state']=='workflow-schema-accepted','Schema result refused')
        stdout,stderr,child=capture('python26',python_argv)
        require(child['state']=='success' and child['exit_code']==0 and child['direct_child_reaped']
            and not child['cleanup_errors'],'Pure-fixture child did not succeed/close')
        actual=json.loads(stdout)
        require(actual['kind']=='AST-selected-functions-pure-fakes-only' and actual['guard_SHA256']==inputs['guard']['sha256']
            and actual['total']==actual['pass']==26 and actual['fail']==0
            and actual['real_children_Git_Swift_SDK_Node_network_Hosted']==0,'Pure-fixture output contract differs')
        names=[row['name'] for row in actual['cases']]
        require(len(names)==len(set(names))==26 and sorted(names)==sorted(FIXTURE_CASES)
            and all(row['state']=='passed' for row in actual['cases']),'Exact26 unique passing cases required')
        require(fixture_inputs()==inputs,'Fixture sources changed');monitor();accepted=True
    except Exception as error:failure=type(error).__name__
    receipt={'state':'accepted-pure-fixture-gate' if accepted else 'unconfirmed-pure-fixture-stopped',
        'source_head':revision,'input_files':inputs,'limits':FIXTURE_LIMITS,'child':child,'Node_preflight':preflight,
        'failure':failure,'actual_cases':len(names),'actual_unique_names':sorted(names),'raw_files':raw_files,
        'sample_count':len(samples),'combined_output_bytes':combined,'seconds':time.monotonic()-started,
        'minimum_sampled_free':min((x['free'] for x in samples),default=None),
        'maximum_sampled_private':max((max(x['private_allocated'],x['private_logical']) for x in samples),default=None),
        'measurement_started':False,'sampling_not_hardpeak_or_all_filesystem_trace':True}
    save(FIXTURE_ROOT/'receipt.json',receipt)
    require(accepted,'Fixture gate refused; Core preparation/measurement must not start')
    require_fixture_passage(revision)


def prepare():
    revision=event_binding();fixture_receipt=require_fixture_passage(revision);require(not ROOT.exists() and not ROOT.is_symlink(),'New owned observation root only')
    parent=ROOT.parent;parent.mkdir(exist_ok=True);require(not parent.is_symlink() and parent.resolve()==parent,'Canonical .local owner required')
    ROOT.mkdir(mode=0o700);(ROOT/'prepare-tmp').mkdir(mode=0o700);env=child_env(ROOT/'prepare-tmp')
    save(ROOT/'fixture-gate-receipt.json',fixture_receipt)
    save(ROOT/'prepare.intent.json',{'source_head':revision,'event':os.environ['GITHUB_EVENT_NAME'],'event_commit':os.environ['GITHUB_SHA'],'env_keys':['PATH','TMPDIR'],'measurement_started':False})
    require(read(WORKSPACE/'.git/HEAD').strip()==revision.encode(),'Checkout must be detached exact head40')
    selection=git_selection(env)
    source_audit=git_audit(WORKSPACE,env,False,selection)
    version=selection['version'];exec_path=Path(selection['exec_path']);backend=Path(selection['backend'])
    required_tools=[NODE,Path('/usr/bin/git'),backend,Path('/usr/bin/xcrun'),Path('/usr/bin/xcode-select')]
    require(plistlib.loads(read(DEVELOPER.parent/'version.plist'))['CFBundleShortVersionString']=='16.4','Xcode16.4 required')
    swift=Path(SWIFTC);sdk_request=probe(['/usr/bin/xcrun','--sdk','macosx','--show-sdk-path'],{'PATH':env['PATH'],'DEVELOPER_DIR':str(DEVELOPER)}).decode().strip();sdk=Path(sdk_request).resolve()
    require(sdk.is_dir() and str(sdk).startswith(str(DEVELOPER/'Platforms/MacOSX.platform/Developer/SDKs')+'/'),'Selected SDK must belong to Xcode16.4')
    arch=platform.machine();require(arch in {'arm64','x86_64'},'Unsupported host architecture');target=arch+'-apple-macosx14.0'
    required_tools += [swift.resolve(),sdk/'SDKSettings.json',DEVELOPER.parent/'version.plist']
    aliases=[]
    for f in [swift,Path(sdk_request),Path('/var/db/xcode_select_link')]:
        if f.is_symlink():aliases.append({'path':str(f),'link':os.readlink(f),'resolved':str(f.resolve())})
    (ROOT/'prepared').mkdir();store=ROOT/'prepared/git';(store/'objects/pack').mkdir(parents=True);(store/'refs').mkdir();(store/'config').write_bytes(BARE_CONFIG);(store/'HEAD').write_text(revision+'\n')
    stored=set()
    def fetch(oid,kind):
        data=git_object(WORKSPACE,oid,kind,env)
        if oid not in stored:
            raw=kind.encode()+b' '+str(len(data)).encode()+b'\0'+data;f=store/'objects'/oid[:2]/oid[2:];f.parent.mkdir(exist_ok=True);f.write_bytes(zlib.compress(raw));stored.add(oid)
        return data
    commit=fetch(revision,'commit');match=re.match(rb'tree ([a-f0-9]{40})\n',commit);require(match is not None,'Raw commit root tree missing');root_tree=match[1].decode();tuples={};tree_count=0
    def walk(oid,prefix='',depth=0):
        nonlocal tree_count
        require(depth<=32,'Tree depth bound');tree_count+=1;require(tree_count<=10000,'Tree count bound');data=fetch(oid,'tree')
        while data:
            head,tail=data.split(b'\0',1);mode,name=head.split(b' ',1);require(len(tail)>=20 and name not in {b'.',b'..'} and b'/'not in name,'Unsafe tree')
            child,data=tail[:20].hex(),tail[20:];rel=prefix+name.decode()
            if mode==b'40000':walk(child,rel+'/',depth+1)
            else:require(mode in {b'100644',b'100755'} and rel not in tuples,'Unsupported source tuple');tuples[rel]=[mode.decode(),'blob',child]
            require(len(tuples)<=10000,'Tuple count bound')
    walk(root_tree)
    docs={rel for rel in tuples if re.fullmatch(r'docs/\d{2}-[a-z0-9-]+/[a-z0-9-]+\.md',rel) and Path(rel).name.lower()!='readme.md'};required=set(SOURCES)|{QUERY_SOURCE}|docs
    for rel in sorted(required):fetch(tuples[rel][2],'blob')
    installation=ROOT/'installation';installation.mkdir()
    for name,digest in INSTALLATION.items():
        rel='ios/tests/'+name;data=git_object(WORKSPACE,tuples[rel][2],'blob',env);require(sha(data)==digest,'Fixed producer/verifier installation differs');(installation/name).write_bytes(data)
    require(git_object(WORKSPACE,tuples['ios/tests/observe-core-notice-hosted-20261031.py'][2],'blob',env)==read(Path(__file__)),'Executed guard differs from source head')
    freeze={'actual_notice_commit':revision,'actual_root_tree':root_tree,'full_tree_tuple_count':len(tuples),'required_blob_paths':sorted(required)};closure=validate_partial_git(revision,freeze)
    bare_audit=git_audit(store,env,True,selection);corpus_inventory=ordinary_copy(WORKSPACE/'ios/AILibrary/Content',ROOT/'prepared/Content')
    save(ROOT/'source-freeze-receipt.json',{'source_head':revision,'root_tree':root_tree,'all_tuples':tuples,'partial_git':freeze,'closure':closure,'origin':'reviewed CI source head, not normal-main/signature provenance'})
    save(ROOT/'corpus-inventory.json',{'files':corpus_inventory,'total':626})
    save(ROOT/'git-execution-audit.json',{'source_checkout':source_audit,'owned_store':bare_audit,'version':version,'exec_path':str(exec_path),'backend':str(backend),'child_env':env,'selection':selection,'trust_premise':GIT_TRUST,'no_outer_GIT_overrides_assumed':True,'backend_scope':'exec-path location and matching --version are observed; not a syscall/exec trace'})
    (ROOT/'run').mkdir(mode=0o700)
    argv=['--run','--repo',str(store),'--revision',revision,'--corpus',str(ROOT/'prepared/Content'),'--output',str(ROOT/'run/observation'),'--swiftc',SWIFTC,'--sdk',str(sdk),'--target',target,'--swift-version','5']
    producer="import {main,installProcessCleanup} from './installation/core-performance-runner.mjs';\nconst remove=installProcessCleanup();try{await main("+json.dumps(argv)+");}finally{remove();}\n"
    verifier="import {main} from './installation/verify-core-performance-notice-20261031.mjs';\nawait main("+json.dumps(['--observation',str(ROOT/'run/observation'),'--corpus',str(ROOT/'prepared/Content'),'--revision',revision])+");\n"
    (ROOT/'producer-entry.mjs').write_text(producer);(ROOT/'verifier-entry.mjs').write_text(verifier)
    files={str(f):fingerprint(f)for f in required_tools+[Path(__file__),Path(fixture_receipt['input_files']['fixture']['path']),FIXTURE_ROOT/'receipt.json',FIXTURE_ROOT/'intent.json',*[FIXTURE_ROOT/row['file'] for row in fixture_receipt['raw_files']],FIXTURE_ROOT/'workflow-schema.mjs',ROOT/'producer-entry.mjs',ROOT/'verifier-entry.mjs']+[installation/n for n in INSTALLATION]}
    controls=['source-freeze-receipt.json','corpus-inventory.json','git-execution-audit.json','fixture-gate-receipt.json'];control_hashes={n:sha(read(ROOT/n,16*1024*1024))for n in controls}
    inputs={'files':list(files.values()),'aliases':aliases,'prepared_inventory':private_inventory(ROOT/'prepared')};save(ROOT/'immutable-inputs.json',inputs)
    spec={'source_head':revision,'limits':LIMITS,'node':str(NODE),'toolchain':{'swiftc':SWIFTC,'sdk':str(sdk),'target':target,'swift_version':'5'},'control_hashes':control_hashes,'immutable_inputs_sha256':sha(read(ROOT/'immutable-inputs.json',16*1024*1024)),'measurement_admission':'Source/guard review and this workflow must be separately adopted; generated pins are consistency, not authentication'}
    save(ROOT/'execution-spec.json',spec);save(ROOT/'prepared.json',{'state':'prepared-not-measured','source_head':revision,'spec_sha256':sha(read(ROOT/'execution-spec.json')),'closure':closure,'Content_files':626,'old_guard_not_run':True})

def run():
    global PROBE_OUTER_DEADLINE
    revision=event_binding();fixture_receipt=require_fixture_passage(revision);spec_bytes=read(ROOT/'execution-spec.json');spec=json.loads(spec_bytes);require(spec['source_head']==revision and spec['limits']==LIMITS and spec['node']==str(NODE),'Fixed run binding differs')
    require(not (ROOT/'run/outer-receipt.json').exists() and not (ROOT/'run/observation').exists(),'One measurement only')
    require(shutil.disk_usage(ROOT).free>=LIMITS['start_free'],'Start3.8GB refused')
    inputs_bytes=read(ROOT/'immutable-inputs.json',16*1024*1024);require(sha(inputs_bytes)==spec['immutable_inputs_sha256'],'Input catalog differs');inputs=json.loads(inputs_bytes)
    control={n:read(ROOT/n,16*1024*1024)for n in spec['control_hashes']};require(all(sha(control[n])==v for n,v in spec['control_hashes'].items()),'Prepared controls differ')
    require(json.loads(control['fixture-gate-receipt.json'])==fixture_receipt,'Frozen fixture passage differs')
    freeze=json.loads(control['source-freeze-receipt.json'])['partial_git'];closure=validate_partial_git(revision,freeze)
    def immutable():
        require(read(ROOT/'execution-spec.json')==spec_bytes and read(ROOT/'immutable-inputs.json',16*1024*1024)==inputs_bytes,'Run operator controls changed')
        for n,d in control.items():require(read(ROOT/n,16*1024*1024)==d,'Prepared control changed')
        for row in inputs['files']:require(fingerprint(Path(row['path']))==row,'Tool/code changed')
        require(private_inventory(ROOT/'prepared')==inputs['prepared_inventory'],'Prepared bytes/modes changed')
        for a in inputs['aliases']:
            f=Path(a['path']);require(f.is_symlink() and os.readlink(f)==a['link'] and str(f.resolve())==a['resolved'],'Tool selection alias changed')
    immutable();started=time.monotonic();PROBE_OUTER_DEADLINE=started+LIMITS['seconds']
    prepared_git=json.loads(control['git-execution-audit.json'])
    # Same literal PATH/TMPDIR values as the unchanged runner's Git children.
    # The runner creates/removes .process-tmp; these read-only probes need not create it.
    git_env=child_env(ROOT/'run/observation/.process-tmp')

    with owned_exclusive_lock(ROOT/'.measurement.lock',str(uuid.uuid4())):
        receipts,samples = [],[]
        total_logs = 0
        failure = None
        known = {}
        groups = set()
        current_child = None
        def owned_processes():
            table = process_rows()
            active = {pid:row for pid,row in table.items() if pid in known and row['start'] == known[pid]}
            changed = True
            while changed:
                changed = False
                anchored_groups = {row['pgid'] for row in active.values()}
                for pid,row in table.items():
                    if pid not in active and (row['ppid'] in active or row['pgid'] in anchored_groups):
                        require(pid not in known or known[pid] == row['start'], 'Known PID was reused')
                        active[pid] = row
                        known[pid] = row['start']
                        groups.add(row['pgid'])
                        changed = True
            return active
        def observe():
            allocated,logical = 0,0
            for current,dirs,files in os.walk(ROOT,followlinks=False):
                for name in dirs+files:
                    path = Path(current)/name
                    try:
                        info = path.lstat()
                    except FileNotFoundError:
                        continue
                    if stat.S_ISLNK(info.st_mode):
                        rel = path.relative_to(ROOT).parts
                        require(len(rel) > 3 and rel[:3] in {('run','observation','module-cache'),('run','observation','.process-tmp')}, 'Unknown generated link')
                        if name in dirs:
                            dirs.remove(name)
                    elif not stat.S_ISREG(info.st_mode) and not stat.S_ISDIR(info.st_mode):
                        raise ValueError('Unknown owned special file')
                    allocated += info.st_blocks*512
                    logical += info.st_size if not stat.S_ISDIR(info.st_mode) else 0
            rss = sum(row['rss'] for row in owned_processes().values())
            sample = {'seconds':time.monotonic()-started,'free':shutil.disk_usage(ROOT).free,
                      'private_allocated':allocated,'private_logical':logical,'owned_tree_RSS':rss}
            samples.append(sample)
            require(sample['seconds'] < LIMITS['seconds'] and sample['free'] >= LIMITS['floor_free']
                    and max(allocated,logical) <= LIMITS['private_bytes'] and rss <= LIMITS['tree_RSS_bytes']
                    and total_logs <= LIMITS['outer_log_bytes'], 'Historical outer resource bound reached')
        def cleanup(child):
            # SIGTERM lets the unchanged runner's registered cleanup synchronously
            # kill its detached groups. Direct-child cleanup never depends on ps.
            monitor_errors = []
            try:
                owned_processes()
            except BaseException as error:
                monitor_errors.append(type(error).__name__)
            if child.poll() is None:
                os.kill(child.pid,signal.SIGTERM)
                try:
                    child.wait(timeout=1)
                except subprocess.TimeoutExpired:
                    # Unreaped start_new_session child cannot be a reused PID.
                    os.killpg(child.pid,signal.SIGKILL)
                    child.wait(timeout=3)
            for group in sorted(groups,reverse=True):
                require(group not in {0,1,os.getpgrp()}, 'Never signal caller/system group')
                try:
                    members = [row for row in owned_processes().values() if row['pgid'] == group]
                except BaseException as error:
                    monitor_errors.append(type(error).__name__)
                    continue
                if members:
                    os.killpg(group,signal.SIGKILL)
            child.wait(timeout=3)
            for stream in [child.stdout,child.stderr]:
                if stream is not None:
                    stream.close()
            try:
                remaining = sorted(owned_processes())
            except BaseException as error:
                monitor_errors.append(type(error).__name__)
                remaining = None
            return {'known_groups':sorted(groups),'known_remaining':remaining,
                    'monitor_errors':monitor_errors,'child_reaped':child.returncode is not None}
        try:
            for stage in ['producer','verifier']:
                known.clear()
                groups.clear()
                immutable()
                observe()
                if stage=='producer':
                    git_before=runtime_git_boundary(git_env)
                    require(all(git_before[k]==prepared_git[k] for k in ['source_checkout','owned_store','selection']),'Git config/default selection drift before producer')
                    save(ROOT/'run/producer.git-before.json',git_before)
                    observe()
                argv = [str(NODE),str(ROOT/(stage+'-entry.mjs'))]
                env = {'PATH':str(NODE.parent)+':/usr/bin:/bin:/usr/sbin:/sbin','LANG':'C','LC_ALL':'C','HOME':str(ROOT/'run'),
                       'TMPDIR':str(ROOT/'run')+'/','NOTICE_SPEC_SHA256':sha(spec_bytes)}
                save(ROOT/'run'/(stage+'.intent.json'),{'argv':argv,'environment':env,'saved_before_Popen':True,
                    'actual_notice_commit':revision,'spec_sha256':sha(spec_bytes)})
                child = subprocess.Popen(argv,cwd=str(ROOT),env=env,stdin=subprocess.DEVNULL,
                    stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
                current_child = child
                snapshot = process_rows()
                require(child.pid in snapshot and snapshot[child.pid]['pgid'] == child.pid, 'Own root group not observed')
                known[child.pid] = snapshot[child.pid]['start']
                groups.add(child.pid)
                save(ROOT/'run'/(stage+'.spawn.json'),{'PID':child.pid,'PGID':child.pid,'start':known[child.pid]})
                selector = selectors.DefaultSelector()
                handles = {}
                try:
                    for key in ['stdout','stderr']:
                        handles[key] = (ROOT/'run'/(stage+'.'+key+'.log')).open('xb')
                        stream = getattr(child,key)
                        os.set_blocking(stream.fileno(),False)
                        selector.register(stream,selectors.EVENT_READ,key)
                    while selector.get_map():
                        observe()
                        for event,_ in selector.select(0.1):
                            block = os.read(event.fd,65536)
                            if not block:
                                selector.unregister(event.fileobj)
                                continue
                            total_logs += len(block)
                            require(total_logs <= LIMITS['outer_log_bytes'], 'Outer combined output8MiB exceeded')
                            handles[event.data].write(block)
                    require(child.wait(timeout=max(0.001,LIMITS['seconds']-(time.monotonic()-started))) == 0, 'Work child failed')
                finally:
                    selector.close()
                    for handle in handles.values():
                        handle.close()
                    outcome = cleanup(child)
                    current_child = None
                    if stage=='producer':
                        git_after=runtime_git_boundary(git_env)
                        save(ROOT/'run/producer.git-after.json',{'boundary':git_after,'matches_before':git_after==git_before})
                        require(git_after==git_before,'Git config/default selection drift after producer')
                require(outcome['known_remaining'] == [] and not outcome['monitor_errors'], 'Observed group closure unconfirmed; no acceptance')
                immutable()
                receipts.append({'stage':stage,'exit_code':child.returncode,'cleanup':outcome})
            observation = ROOT/'run/observation'
            raw = [path for path in observation.iterdir() if re.fullmatch(r'\d{2}-.+\.json',path.name)]
            require(len(raw) == 19 and all((path.with_suffix('.stderr.txt')).is_file() for path in raw), 'Retain raw19 stdout/stderr pairs')
            require((observation/'published-core-benchmark').is_file() and (observation/'compiler.stderr.txt').is_file(), 'Retain binary/compiler stderr')
            accepted = json.loads(read(ROOT/'run/verifier.stdout.log'))
            require(accepted['status'] == 'accepted-host-observation' and accepted['source_revision'] == revision
                    and accepted['raw_invocations'] == 19 and accepted['measured_samples'] == 15
                    and accepted['performance_budget'] == 'unadopted', 'Separate fixed Notice verifier did not accept exact protocol')
            observe()
        except BaseException as error:
            failure = {'type':type(error).__name__,'message':str(error)[:500]}
        finally:
            if current_child is not None:
                try:
                    receipts.append({'stage':'aborted','cleanup':cleanup(current_child)})
                except BaseException as error:
                    receipts.append({'stage':'cleanup-unconfirmed','error':type(error).__name__})
            artifacts = []
            inventory_error = None
            try:
                observation = ROOT/'run/observation'
                if observation.is_dir() and not observation.is_symlink():
                    for path in sorted(observation.iterdir()):
                        if path.name not in {'module-cache','.process-tmp'}:
                            artifacts.append({**fingerprint(path),'mode':format(stat.S_IMODE(path.lstat().st_mode),'04o')})
                    save(ROOT/'run/retained-observation-inventory.json',{'files':artifacts,'cache_and_process_tmp_excluded_from_catalog_only':True})
            except BaseException as error:
                inventory_error = type(error).__name__
                failure = failure or {'type':'RetentionInventoryUnconfirmed','message':inventory_error}
            receipt = {'state':'saved-host-observation-only' if failure is None and len(receipts) == 2 else 'unconfirmed-stopped',
                'failure':failure,'actual_notice_commit':revision,'partial_git_closure':closure,'steps':receipts,
                'seconds':time.monotonic()-started,'limits':LIMITS,'outer_log_bytes':total_logs,
                'minimum_sampled_free':min((x['free'] for x in samples),default=None),
                'maximum_sampled_private':max((max(x['private_allocated'],x['private_logical']) for x in samples),default=None),
                'maximum_sampled_owned_tree_RSS':max((x['owned_tree_RSS'] for x in samples),default=None),
                'sampling':'0.1s select plus ps/filesystem scans; not instantaneous/hardpeak or process isolation proof',
                'retention':'No raw/binary/corpus/object-store/provenance cleanup; compiler stdout not separately retained by unchanged CLI',
                'retained_observation_files':len(artifacts),'retention_inventory_error':inventory_error,
                'IOS15_or_iOS_App_runtime_budget_acceptance':False}
            save(ROOT/'run/outer-receipt.json',receipt)
        return 0 if failure is None and len(receipts) == 2 else 1


def entry():
    try:
        require(sys.argv[1:] in [['--fixtures'],['--prepare'],['--run']], 'Explicit prepare or one run required')
        if sys.argv[1]=='--fixtures':fixture_gate();return 0
        if sys.argv[1]=='--prepare': prepare(); return 0
        return run()
    except Exception as error:
        stopped_root=FIXTURE_ROOT if sys.argv[1:]==['--fixtures'] else ROOT
        if stopped_root.is_dir() and not stopped_root.is_symlink() and not (stopped_root/'stopped.json').exists():
            save(stopped_root/'stopped.json',{'state':'unconfirmed-stopped','phase':sys.argv[1:],'type':type(error).__name__,'message':str(error)[:500],'success':False})
        print('Hosted Core observation stopped: '+type(error).__name__,file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(entry())
