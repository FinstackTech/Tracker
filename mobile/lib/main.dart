import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const TrackerMobileApp());
}

class TrackerMobileApp extends StatelessWidget {
  const TrackerMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Finstack PPM Cockpit',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          primary: const Color(0xFF4F46E5),
          surface: const Color(0xFFF8FAFC),
        ),
        fontFamily: 'sans-serif',
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
          ),
        ),
      ),
      darkTheme: ThemeData.dark().copyWith(
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.dark,
          seedColor: const Color(0xFF818CF8),
          primary: const Color(0xFF818CF8),
        ),
      ),
      home: const ConnectionScreen(),
    );
  }
}

class ConnectionScreen extends StatefulWidget {
  const ConnectionScreen({super.key});

  @override
  State<ConnectionScreen> createState() => _ConnectionScreenState();
}

class _ConnectionScreenState extends State<ConnectionScreen> {
  final _urlController = TextEditingController(text: 'http://localhost:3000');
  String _errorMessage = '';
  bool _connecting = false;

  Future<void> _testConnection() async {
    setState(() {
      _connecting = true;
      _errorMessage = '';
    });
    
    String url = _urlController.text.trim();

    try {
      final response = await http.get(Uri.parse('$url/api/projects')).timeout(
        const Duration(seconds: 4),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => LoginScreen(baseUrl: url),
              ),
            );
          }
          return;
        }
      }
      setState(() {
        _errorMessage = 'Server connected but returned invalid response.';
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Cannot connect. If using an Android Emulator, try http://10.0.2.2:3000 instead of localhost.';
      });
    } finally {
      setState(() {
        _connecting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.center,
                child: Container(
                  height: 64,
                  width: 64,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.dashboard_customize_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'FINSTACK PPM COCKPIT',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Mobile Companion Integration',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _urlController,
                decoration: InputDecoration(
                  labelText: 'Next.js Backend Server URL',
                  hintText: 'e.g. http://10.0.2.2:3000',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.lan_outlined),
                ),
                style: const TextStyle(fontWeight: FontWeight.w600),
                keyboardType: TextInputType.url,
              ),
              if (_errorMessage.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _errorMessage,
                  style: const TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _connecting ? null : _testConnection,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _connecting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text(
                        'Initialize OIDC Connection',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  final String baseUrl;
  const LoginScreen({super.key, required this.baseUrl});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  List<Map<String, String>> _profiles = [];
  late Map<String, String> _selectedProfile;
  bool _signingIn = false;
  bool _loadingProfiles = true;

  @override
  void initState() {
    super.initState();
    _loadUserProfiles();
  }

  Future<void> _loadUserProfiles() async {
    try {
      final response = await http.get(Uri.parse('${widget.baseUrl}/api/employees')).timeout(
        const Duration(seconds: 4),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          final List<dynamic> list = data['data'] ?? [];
          setState(() {
            _profiles = list.map((item) => {
              'name': (item['name'] ?? '').toString(),
              'role': (item['role'] ?? 'Employee').toString(),
              'email': (item['email'] ?? '').toString(),
              'team': (item['team'] ?? 'Engineering').toString(),
              'status': (item['status'] ?? 'Active').toString(),
            }).toList();
            if (_profiles.isNotEmpty) {
              _selectedProfile = _profiles[0];
            }
            _loadingProfiles = false;
          });
          return;
        }
      }
    } catch (e) {
      debugPrint('Error loading profiles: $e');
    }
    // Fallback: if fetch fails, use a local default Superadmin
    setState(() {
      _profiles = [
        {'name': 'Superadmin', 'role': 'Admin', 'email': 'superadmin@company.com', 'team': 'Operations', 'status': 'Active'}
      ];
      _selectedProfile = _profiles[0];
      _loadingProfiles = false;
    });
  }

  void _performLogin() {
    setState(() {
      _signingIn = true;
    });
    
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CockpitHomeScreen(
              baseUrl: widget.baseUrl,
              currentUser: _selectedProfile,
              initialProfiles: _profiles,
            ),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingProfiles) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Simulate Identity Sign-In', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Identity Provider (OIDC)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Select a security profile to sign into the Finstack PPM network.',
                style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<Map<String, String>>(
                    value: _selectedProfile,
                    isExpanded: true,
                    items: _profiles.map((prof) {
                      return DropdownMenuItem<Map<String, String>>(
                        value: prof,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(prof['name']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 2),
                            Text('${prof['role']} • ${prof['email']}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedProfile = val;
                        });
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _signingIn ? null : _performLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _signingIn
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Connect Secure Session', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CockpitHomeScreen extends StatefulWidget {
  final String baseUrl;
  final Map<String, String> currentUser;
  final List<Map<String, String>> initialProfiles;

  const CockpitHomeScreen({
    super.key,
    required this.baseUrl,
    required this.currentUser,
    required this.initialProfiles,
  });

  @override
  State<CockpitHomeScreen> createState() => _CockpitHomeScreenState();
}

class _CockpitHomeScreenState extends State<CockpitHomeScreen> {
  int _currentIndex = 0;
  List<dynamic> _projects = [];
  dynamic _activeProject;
  bool _loadingProjects = true;
  late List<Map<String, String>> _userProfiles;
  late Map<String, String> _activeSessionUser;

  @override
  void initState() {
    super.initState();
    _userProfiles = List<Map<String, String>>.from(widget.initialProfiles);
    _activeSessionUser = widget.currentUser;
    _fetchProjects();
    _fetchUserProfiles();
  }

  Future<void> _fetchUserProfiles() async {
    try {
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/employees'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        final List<dynamic> list = data['data'] ?? [];
        setState(() {
          _userProfiles = list.map((item) => {
            'name': (item['name'] ?? '').toString(),
            'role': (item['role'] ?? 'Employee').toString(),
            'email': (item['email'] ?? '').toString(),
            'team': (item['team'] ?? 'Engineering').toString(),
            'status': (item['status'] ?? 'Active').toString(),
          }).toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading profiles: $e');
    }
  }

  Future<void> _fetchProjects() async {
    setState(() {
      _loadingProjects = true;
    });
    try {
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/projects'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _projects = data['data'] ?? [];
          if (_projects.isNotEmpty) {
            // Find if previous active project still exists, else pick first
            if (_activeProject != null) {
              final matched = _projects.firstWhere(
                (p) => p['_id'] == _activeProject['_id'],
                orElse: () => _projects[0],
              );
              _activeProject = matched;
            } else {
              _activeProject = _projects[0];
            }
          } else {
            _activeProject = null;
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading projects: $e');
    } finally {
      setState(() {
        _loadingProjects = false;
      });
    }
  }

  void _addNewProjectLocally(dynamic newProj) {
    setState(() {
      _projects.add(newProj);
      _activeProject = newProj;
    });
  }

  Future<void> _addNewUser(Map<String, String> user) async {
    try {
      final res = await http.post(
        Uri.parse('${widget.baseUrl}/api/employees'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(user),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        await _fetchUserProfiles();
      }
    } catch (e) {
      debugPrint('Error creating employee: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      MobileBentoDashboard(baseUrl: widget.baseUrl, activeProject: _activeProject),
      MobileWorkBoard(baseUrl: widget.baseUrl, activeProject: _activeProject, currentUser: _activeSessionUser),
      MobileDailyLogs(baseUrl: widget.baseUrl, activeProject: _activeProject, currentUser: _activeSessionUser),
      MobileHRHub(
        baseUrl: widget.baseUrl, 
        currentUser: _activeSessionUser, 
        userProfiles: _userProfiles,
        onAddUser: _addNewUser,
        onRefreshUsers: _fetchUserProfiles,
      ),
      MobileProjectsPortfolio(
        baseUrl: widget.baseUrl, 
        projects: _projects, 
        activeProject: _activeProject,
        currentUser: _activeSessionUser,
        onActivate: (proj) {
          setState(() {
            _activeProject = proj;
          });
        },
        onAddProject: _addNewProjectLocally,
        onRefresh: _fetchProjects,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: _loadingProjects 
          ? const Text('Loading Cockpit...', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold))
          : _activeProject == null
              ? const Text('Portfolio Registry', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold))
              : DropdownButtonHideUnderline(
                  child: DropdownButton<dynamic>(
                    value: _activeProject,
                    dropdownColor: Theme.of(context).cardColor,
                    alignment: Alignment.centerLeft,
                    items: _projects.map((proj) {
                      return DropdownMenuItem<dynamic>(
                        value: proj,
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEEF2F6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                proj['code'] ?? '', 
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF4F46E5)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(proj['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _activeProject = val;
                      });
                    },
                  ),
                ),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded, size: 20),
            onPressed: () {
              _fetchProjects();
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: CircleAvatar(
              radius: 14,
              backgroundColor: const Color(0xFF4F46E5),
              child: Text(
                _activeSessionUser['name']!.substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          )
        ],
      ),
      body: _loadingProjects 
        ? const Center(child: CircularProgressIndicator())
        : screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFF4F46E5),
          unselectedItemColor: Colors.grey,
          selectedFontSize: 9,
          unselectedFontSize: 9,
          onTap: (idx) {
            setState(() {
              _currentIndex = idx;
            });
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.check_box_outlined), label: 'Work Board'),
            BottomNavigationBarItem(icon: Icon(Icons.assignment_turned_in_outlined), label: 'Standup'),
            BottomNavigationBarItem(icon: Icon(Icons.people_outline_rounded), label: 'HR Hub'),
            BottomNavigationBarItem(icon: Icon(Icons.folder_open_outlined), label: 'Portfolio'),
          ],
        ),
      ),
    );
  }
}

class MobileBentoDashboard extends StatefulWidget {
  final String baseUrl;
  final dynamic activeProject;

  const MobileBentoDashboard({super.key, required this.baseUrl, required this.activeProject});

  @override
  State<MobileBentoDashboard> createState() => _MobileBentoDashboardState();
}

class _MobileBentoDashboardState extends State<MobileBentoDashboard> {
  int _totalTasks = 0;
  int _completedTasks = 0;
  int _openBugs = 0;
  double _completionRate = 0.0;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  @override
  void didUpdateWidget(covariant MobileBentoDashboard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeProject != widget.activeProject) {
      _loadDashboardData();
    }
  }

  Future<void> _loadDashboardData() async {
    if (widget.activeProject == null) {
      setState(() {
        _totalTasks = 0;
        _completedTasks = 0;
        _openBugs = 0;
        _completionRate = 0.0;
      });
      return;
    }
    setState(() {
      _loading = true;
    });

    final projId = widget.activeProject['_id'];
    try {
      final tasksRes = await http.get(Uri.parse('${widget.baseUrl}/api/tasks?projectId=$projId'));
      final issuesRes = await http.get(Uri.parse('${widget.baseUrl}/api/issues?projectId=$projId'));

      final tasksData = jsonDecode(tasksRes.body);
      final issuesData = jsonDecode(issuesRes.body);

      if (tasksData['success'] == true && issuesData['success'] == true) {
        final List<dynamic> tList = tasksData['data'] ?? [];
        final List<dynamic> iList = issuesData['data'] ?? [];

        final total = tList.length;
        final completed = tList.where((t) => t['status'] == 'done').length;
        final bugs = iList.where((i) => i['status'] != 'closed' && i['status'] != 'resolved').length;

        setState(() {
          _totalTasks = total;
          _completedTasks = completed;
          _openBugs = bugs;
          _completionRate = total > 0 ? (completed / total) * 100 : 0.0;
        });
      }
    } catch (e) {
      debugPrint('Error loading dashboard: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (widget.activeProject == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text(
            'Welcome! Initialize or select a Project Portfolio workspace to view metrics.',
            style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bento Cell 1: Delivery Rate
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DELIVERY PROGRESS RATE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${_completionRate.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Color(0xFF4F46E5))),
                      Text('$_completedTasks / $_totalTasks Initiatives Done', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: _completionRate / 100.0,
                      minHeight: 8,
                      backgroundColor: const Color(0xFFEEF2F6),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4F46E5)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Bento Row 2: Bugs & Tasks Count
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.bug_report_rounded, color: Colors.redAccent, size: 24),
                        const SizedBox(height: 12),
                        const Text('Active Bugs', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('$_openBugs Bugs', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.task_alt_rounded, color: Color(0xFF10B981), size: 24),
                        const SizedBox(height: 12),
                        const Text('Total Tasks', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('$_totalTasks Items', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Bento Cell 3: Cockpit Info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('COCKPIT STATUS INFO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 14),
                  _buildStatusRow('Active Client', widget.activeProject['client'] ?? 'Internal'),
                  const Divider(height: 20, color: Color(0xFFEEF2F6)),
                  _buildStatusRow('Delivery Mode', widget.activeProject['type'] == 'delivery' ? 'Implementation' : 'Maintenance'),
                  const Divider(height: 20, color: Color(0xFFEEF2F6)),
                  _buildStatusRow('Status', (widget.activeProject['status'] ?? 'Active').toString().toUpperCase()),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
      ],
    );
  }
}

class MobileWorkBoard extends StatefulWidget {
  final String baseUrl;
  final dynamic activeProject;
  final Map<String, String> currentUser;

  const MobileWorkBoard({
    super.key,
    required this.baseUrl,
    required this.activeProject,
    required this.currentUser,
  });

  @override
  State<MobileWorkBoard> createState() => _MobileWorkBoardState();
}

class _MobileWorkBoardState extends State<MobileWorkBoard> {
  int _activeSubTab = 0; // 0 for Tasks, 1 for Issues
  List<dynamic> _tasks = [];
  List<dynamic> _issues = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void didUpdateWidget(covariant MobileWorkBoard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeProject != widget.activeProject) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    if (widget.activeProject == null) {
      setState(() {
        _tasks = [];
        _issues = [];
      });
      return;
    }
    setState(() {
      _loading = true;
    });
    try {
      final projId = widget.activeProject['_id'];
      final tasksRes = await http.get(Uri.parse('${widget.baseUrl}/api/tasks?projectId=$projId'));
      final issuesRes = await http.get(Uri.parse('${widget.baseUrl}/api/issues?projectId=$projId'));

      final tasksData = jsonDecode(tasksRes.body);
      final issuesData = jsonDecode(issuesRes.body);

      if (tasksData['success'] == true && issuesData['success'] == true) {
        setState(() {
          _tasks = tasksData['data'] ?? [];
          _issues = issuesData['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading workboard: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _updateTaskStatus(String id, String newStatus) async {
    try {
      final res = await http.put(
        Uri.parse('${widget.baseUrl}/api/tasks'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          '_id': id,
          'status': newStatus,
          'actor': widget.currentUser['name'],
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        _loadData();
      }
    } catch (e) {
      debugPrint('Error updating task: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.activeProject == null) {
      return const Center(child: Text('Please select a project to view tasks.'));
    }

    return Column(
      children: [
        // Sub-tabs segment switcher
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeSubTab = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _activeSubTab == 0 ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Tasks Board (${_tasks.length})',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _activeSubTab == 0 ? const Color(0xFF4F46E5) : Colors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeSubTab = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _activeSubTab == 1 ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Active Bugs (${_issues.length})',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _activeSubTab == 1 ? const Color(0xFF4F46E5) : Colors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _activeSubTab == 0 
                ? _buildTasksTab() 
                : _buildIssuesTab(),
        ),
      ],
    );
  }

  Widget _buildTasksTab() {
    if (_tasks.isEmpty) {
      return const Center(child: Text('No tasks created for this project workspace.', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12.0),
      itemCount: _tasks.length,
      itemBuilder: (context, idx) {
        final t = _tasks[idx];
        if (t['type'] == 'heading') {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 8.0),
            child: Text(
              (t['title'] ?? '').toString().toUpperCase(),
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.indigo, letterSpacing: 1.5),
            ),
          );
        }

        final status = t['status'] ?? 'not-started';
        final isDone = status == 'done';
        
        return Card(
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: Icon(
              isDone ? Icons.check_circle_rounded : Icons.circle_outlined,
              color: isDone ? const Color(0xFF10B981) : Colors.grey,
            ),
            title: Text(
              t['title'] ?? '',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                decoration: isDone ? TextDecoration.lineThrough : null,
                color: isDone ? Colors.grey : null,
              ),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Row(
                children: [
                  if (t['owner'] != null && t['owner'].toString().isNotEmpty) ...[
                    Text('Owner: ${t['owner']}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                  ],
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: t['blocked'] == true ? Colors.red.shade50 : Colors.indigo.shade50,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      t['blocked'] == true ? 'BLOCKED ⚠️' : (t['priority'] ?? 'medium').toString().toUpperCase(),
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        color: t['blocked'] == true ? Colors.red : const Color(0xFF4F46E5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            trailing: PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded, size: 20),
              onSelected: (val) {
                _updateTaskStatus(t['_id'], val);
              },
              itemBuilder: (context) {
                return [
                  const PopupMenuItem(value: 'not-started', child: Text('Not Started', style: TextStyle(fontSize: 12))),
                  const PopupMenuItem(value: 'in-progress', child: Text('In Progress', style: TextStyle(fontSize: 12))),
                  const PopupMenuItem(value: 'done', child: Text('Mark Done ✅', style: TextStyle(fontSize: 12))),
                ];
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildIssuesTab() {
    if (_issues.isEmpty) {
      return const Center(child: Text('All clear! Zero active bugs reported.', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12.0),
      itemCount: _issues.length,
      itemBuilder: (context, idx) {
        final issue = _issues[idx];
        final priority = issue['priority'] ?? 'medium';
        final status = issue['status'] ?? 'open';
        
        return Card(
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            title: Text(issue['title'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 6.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(issue['description'] ?? 'No description.', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: priority == 'critical' || priority == 'high' 
                              ? Colors.red.shade50 
                              : Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          priority.toString().toUpperCase(),
                          style: TextStyle(
                            fontSize: 8, 
                            fontWeight: FontWeight.bold,
                            color: priority == 'critical' || priority == 'high' 
                                ? Colors.red 
                                : Colors.amber.shade900,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          status.toString().toUpperCase(),
                          style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.blue),
                        ),
                      ),
                      const Spacer(),
                      if (issue['assignee'] != null && issue['assignee'].toString().isNotEmpty)
                        Text(
                          'Assignee: ${issue['assignee']}',
                          style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w600),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class MobileDailyLogs extends StatefulWidget {
  final String baseUrl;
  final dynamic activeProject;
  final Map<String, String> currentUser;

  const MobileDailyLogs({
    super.key,
    required this.baseUrl,
    required this.activeProject,
    required this.currentUser,
  });

  @override
  State<MobileDailyLogs> createState() => _MobileDailyLogsState();
}

class _MobileDailyLogsState extends State<MobileDailyLogs> {
  List<dynamic> _logs = [];
  bool _loading = false;
  final _taskController = TextEditingController();
  final _hoursController = TextEditingController(text: '8');
  String _status = 'completed';
  String _blockers = '';

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() {
      _loading = true;
    });
    try {
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/logs'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _logs = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading logs: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _submitLog() async {
    if (_taskController.text.trim().isEmpty) return;

    try {
      final res = await http.post(
        Uri.parse('${widget.baseUrl}/api/logs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'employeeName': widget.currentUser['name'],
          'date': DateTime.now().toIso8601String().substring(0, 10),
          'projectId': widget.activeProject != null ? widget.activeProject['_id'] : null,
          'taskDescription': _taskController.text.trim(),
          'hoursSpent': double.tryParse(_hoursController.text) ?? 8,
          'status': _status,
          'blockers': _status == 'blocked' ? _blockers : '',
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        _taskController.clear();
        setState(() {
          _status = 'completed';
          _blockers = '';
        });
        _loadLogs();
        if (mounted) {
          ScaffoldMessenger.of(context).showToast('Standup log successfully posted!');
        }
      }
    } catch (e) {
      debugPrint('Error submitting log: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12.0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('LOG TODAY\'S STANDUP ACTIVITY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _taskController,
                    decoration: const InputDecoration(
                      labelText: 'What did you accomplish today?',
                      hintText: 'e.g. Completed sanctions checker integration...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                      contentPadding: EdgeInsets.all(12),
                    ),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _hoursController,
                          decoration: const InputDecoration(
                            labelText: 'Hours',
                            border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                            contentPadding: EdgeInsets.all(12),
                          ),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _status,
                          decoration: const InputDecoration(
                            labelText: 'Status',
                            border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                          ),
                          style: const TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w600),
                          items: const [
                            DropdownMenuItem(value: 'completed', child: Text('Completed')),
                            DropdownMenuItem(value: 'in-progress', child: Text('In Progress')),
                            DropdownMenuItem(value: 'blocked', child: Text('Blocked ⚠️')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _status = val;
                              });
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  if (_status == 'blocked') ...[
                    const SizedBox(height: 12),
                    TextField(
                      onChanged: (val) {
                        _blockers = val;
                      },
                      decoration: const InputDecoration(
                        labelText: 'Describe Blockage Reason',
                        hintText: 'e.g. Waiting for SWIFT api credentials...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _submitLog,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Post Standup Log', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text('TEAM ACTIVITY REGISTER', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
          ),
        ),
        Expanded(
          child: _loading 
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  itemCount: _logs.length,
                  itemBuilder: (context, idx) {
                    final l = _logs[idx];
                    final isBlocked = l['status'] == 'blocked';
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isBlocked ? Colors.red.shade100 : Colors.indigo.shade50,
                          child: Text(
                            l['employeeName'] != null ? l['employeeName'].toString().substring(0, 1).toUpperCase() : 'U',
                            style: TextStyle(color: isBlocked ? Colors.red : const Color(0xFF4F46E5), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                        title: Text(l['taskDescription'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${l['employeeName']} • ${l['hoursSpent']} hrs spent • ${l['date']}',
                              style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500),
                            ),
                            if (isBlocked && l['blockers'] != null && l['blockers'].toString().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Text(
                                  'Blocked: ${l['blockers']}',
                                  style: const TextStyle(fontSize: 10, color: Colors.red, fontWeight: FontWeight.w600),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        )
      ],
    );
  }
}

// Unified HR & Employee Management Hub
class MobileHRHub extends StatefulWidget {
  final String baseUrl;
  final Map<String, String> currentUser;
  final List<Map<String, String>> userProfiles;
  final Function(Map<String, String>) onAddUser;
  final VoidCallback onRefreshUsers;

  const MobileHRHub({
    super.key, 
    required this.baseUrl, 
    required this.currentUser,
    required this.userProfiles,
    required this.onAddUser,
    required this.onRefreshUsers,
  });

  @override
  State<MobileHRHub> createState() => _MobileHRHubState();
}

class _MobileHRHubState extends State<MobileHRHub> {
  int _activeSegment = 0; // 0 for Team, 1 for Leaves
  List<dynamic> _leaves = [];
  bool _loadingLeaves = false;

  // New Employee fields
  final _empNameController = TextEditingController();
  final _empEmailController = TextEditingController();
  String _empRole = 'Employee';
  String _empTeam = 'Engineering';

  // New Leave fields
  final _startController = TextEditingController();
  final _endController = TextEditingController();
  final _notesController = TextEditingController();
  String _leaveType = 'annual';

  @override
  void initState() {
    super.initState();
    _loadLeaves();
  }

  Future<void> _loadLeaves() async {
    setState(() {
      _loadingLeaves = true;
    });
    try {
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/leaves'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _leaves = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading leaves: $e');
    } finally {
      setState(() {
        _loadingLeaves = false;
      });
    }
  }

  Future<void> _submitLeave() async {
    if (_startController.text.isEmpty || _endController.text.isEmpty) return;

    try {
      final res = await http.post(
        Uri.parse('${widget.baseUrl}/api/leaves'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'employeeName': widget.currentUser['name'],
          'startDate': _startController.text,
          'endDate': _endController.text,
          'type': _leaveType,
          'notes': _notesController.text.trim(),
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        _startController.clear();
        _endController.clear();
        _notesController.clear();
        _loadLeaves();
        if (mounted) {
          ScaffoldMessenger.of(context).showToast('Leave request submitted!');
        }
      }
    } catch (e) {
      debugPrint('Error submitting leave: $e');
    }
  }

  void _createEmployeeProfile() {
    if (_empNameController.text.trim().isEmpty || _empEmailController.text.trim().isEmpty) return;
    
    final newUser = {
      'name': _empNameController.text.trim(),
      'role': _empRole,
      'email': _empEmailController.text.trim(),
      'team': _empTeam,
    };
    
    widget.onAddUser(newUser);
    
    _empNameController.clear();
    _empEmailController.clear();
    
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showToast('New employee profile created successfully!');
    }
  }

  void _showAddEmployeeDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                top: 20,
                left: 20,
                right: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('ADD NEW EMPLOYEE PROFILE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                        IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded))
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _empNameController,
                      decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _empEmailController,
                      decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _empRole,
                      decoration: const InputDecoration(labelText: 'Role Permission', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w600),
                      items: const [
                        DropdownMenuItem(value: 'Admin', child: Text('Admin')),
                        DropdownMenuItem(value: 'Project Manager', child: Text('Project Manager')),
                        DropdownMenuItem(value: 'HR', child: Text('HR')),
                        DropdownMenuItem(value: 'Developer', child: Text('Developer')),
                        DropdownMenuItem(value: 'Employee', child: Text('Employee')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => _empRole = val);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _empTeam,
                      decoration: const InputDecoration(labelText: 'Department', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w600),
                      items: const [
                        DropdownMenuItem(value: 'Engineering', child: Text('Engineering')),
                        DropdownMenuItem(value: 'Product', child: Text('Product')),
                        DropdownMenuItem(value: 'HR', child: Text('HR')),
                        DropdownMenuItem(value: 'Finance', child: Text('Finance')),
                        DropdownMenuItem(value: 'Operations', child: Text('Operations')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => _empTeam = val);
                        }
                      },
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _createEmployeeProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Create Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            );
          }
        );
      }
    );
  }

  Future<void> _deleteEmployeeProfile(String name) async {
    if (name == widget.currentUser['name']) {
      ScaffoldMessenger.of(context).showToast('Cannot delete the logged-in user profile!');
      return;
    }
    try {
      final res = await http.delete(
        Uri.parse('${widget.baseUrl}/api/employees?name=$name'),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        widget.onRefreshUsers();
        if (mounted) {
          ScaffoldMessenger.of(context).showToast('Employee profile deleted successfully!');
        }
      }
    } catch (e) {
      debugPrint('Error deleting employee: $e');
    }
  }

  Future<void> _deleteLeaveRequest(String id) async {
    try {
      final res = await http.delete(
        Uri.parse('${widget.baseUrl}/api/leaves?id=$id'),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        _loadLeaves();
        if (mounted) {
          ScaffoldMessenger.of(context).showToast('Leave request removed!');
        }
      }
    } catch (e) {
      debugPrint('Error deleting leave: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // HR Hub Navigation Swapping
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeSegment = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _activeSegment == 0 ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Team Directory',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _activeSegment == 0 ? const Color(0xFF4F46E5) : Colors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeSegment = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _activeSegment == 1 ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Leaves Registry',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _activeSegment == 1 ? const Color(0xFF4F46E5) : Colors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: _activeSegment == 0 ? _buildTeamTab() : _buildLeavesTab(),
        ),
      ],
    );
  }

  Widget _buildTeamTab() {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        itemCount: widget.userProfiles.length,
        itemBuilder: (context, idx) {
          final u = widget.userProfiles[idx];
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: const Color(0xFFEEF2F6),
                child: Text(
                  u['name']!.substring(0, 1).toUpperCase(),
                  style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(u['name']!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              subtitle: Text('${u['role']} • ${u['email']}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2F6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      (u['team'] ?? 'Engineering').toUpperCase(),
                      style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                    ),
                  ),
                  if ((widget.currentUser['role'] == 'Admin' || widget.currentUser['role'] == 'HR') && u['name'] != widget.currentUser['name']) ...[
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                      onPressed: () => _deleteEmployeeProfile(u['name']!),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddEmployeeDialog,
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        mini: true,
        child: const Icon(Icons.person_add_alt_1_rounded),
      ),
    );
  }

  Widget _buildLeavesTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 4.0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('REQUEST CAPACITY VACATION LEAVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _startController,
                          decoration: const InputDecoration(
                            labelText: 'Start Date',
                            hintText: 'YYYY-MM-DD',
                            border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                            contentPadding: EdgeInsets.all(10),
                          ),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _endController,
                          decoration: const InputDecoration(
                            labelText: 'End Date',
                            hintText: 'YYYY-MM-DD',
                            border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                            contentPadding: EdgeInsets.all(10),
                          ),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _leaveType,
                    decoration: const InputDecoration(
                      labelText: 'Type of Leave',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    ),
                    style: const TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w600),
                    items: const [
                      DropdownMenuItem(value: 'annual', child: Text('Annual Leave')),
                      DropdownMenuItem(value: 'sick', child: Text('Sick Leave')),
                      DropdownMenuItem(value: 'casual', child: Text('Casual Leave')),
                      DropdownMenuItem(value: 'unpaid', child: Text('Unpaid Leave')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _leaveType = val;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes / Reason',
                      hintText: 'e.g. Summer family vacation...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                      contentPadding: EdgeInsets.all(10),
                    ),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _submitLeave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Submit Request', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text('REGISTERED CAPACITY LEAVES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
          ),
        ),
        Expanded(
          child: _loadingLeaves 
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  itemCount: _leaves.length,
                  itemBuilder: (context, idx) {
                    final l = _leaves[idx];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: ListTile(
                        leading: const Icon(Icons.flight_takeoff_rounded, color: Color(0xFF4F46E5)),
                        title: Text(l['employeeName'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          '${l['startDate']} to ${l['endDate']} (${l['daysCount']} days) • ${l['notes'] ?? ''}',
                          style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500),
                        ),
                        trailing: (widget.currentUser['role'] == 'Admin' || widget.currentUser['role'] == 'HR' || l['employeeName'] == widget.currentUser['name'])
                            ? IconButton(
                                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                                onPressed: () => _deleteLeaveRequest(l['_id']),
                              )
                            : null,
                      ),
                    );
                  },
                ),
        )
      ],
    );
  }
}

// Portfolio & Project Management
class MobileProjectsPortfolio extends StatefulWidget {
  final String baseUrl;
  final List<dynamic> projects;
  final dynamic activeProject;
  final Function(dynamic) onActivate;
  final Function(dynamic) onAddProject;
  final VoidCallback onRefresh;

  final Map<String, String> currentUser;

  const MobileProjectsPortfolio({
    super.key,
    required this.baseUrl,
    required this.projects,
    required this.activeProject,
    required this.currentUser,
    required this.onActivate,
    required this.onAddProject,
    required this.onRefresh,
  });

  @override
  State<MobileProjectsPortfolio> createState() => _MobileProjectsPortfolioState();
}

class _MobileProjectsPortfolioState extends State<MobileProjectsPortfolio> {
  Future<void> _deleteProjectWorkspace(String id) async {
    try {
      final res = await http.delete(
        Uri.parse('${widget.baseUrl}/api/projects?id=$id'),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        widget.onRefresh();
        if (mounted) {
          ScaffoldMessenger.of(context).showToast('Project workspace deleted!');
        }
      }
    } catch (e) {
      debugPrint('Error deleting project: $e');
    }
  }

  final _projNameController = TextEditingController();
  final _projCodeController = TextEditingController();
  final _projClientController = TextEditingController();
  String _projType = 'delivery';
  bool _savingProject = false;

  Future<void> _createProjectWorkspace() async {
    if (_projNameController.text.trim().isEmpty || _projCodeController.text.trim().isEmpty) return;
    
    setState(() {
      _savingProject = true;
    });

    try {
      final res = await http.post(
        Uri.parse('${widget.baseUrl}/api/projects'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': _projNameController.text.trim(),
          'code': _projCodeController.text.trim().toUpperCase(),
          'client': _projClientController.text.trim(),
          'type': _projType,
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        final newProj = data['data'];
        widget.onAddProject(newProj);
        _projNameController.clear();
        _projCodeController.clear();
        _projClientController.clear();
        
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showToast('New Project workspace initialized successfully!');
        }
      }
    } catch (e) {
      debugPrint('Error creating project: $e');
    } finally {
      setState(() {
        _savingProject = false;
      });
    }
  }

  void _showAddProjectDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                top: 20,
                left: 20,
                right: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('INITIALIZE PROJECT PROFILE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                        IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded))
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _projNameController,
                      decoration: const InputDecoration(labelText: 'Project Name', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _projCodeController,
                      decoration: const InputDecoration(labelText: 'Project Code (e.g. DIB-CORE)', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _projClientController,
                      decoration: const InputDecoration(labelText: 'Client Name', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _projType,
                      decoration: const InputDecoration(labelText: 'Focus Focus Type', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w600),
                      items: const [
                        DropdownMenuItem(value: 'delivery', child: Text('Active Project Delivery (Implementation)')),
                        DropdownMenuItem(value: 'maintenance', child: Text('SLA Project Maintenance (Ongoing Support)')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => _projType = val);
                        }
                      },
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _savingProject ? null : _createProjectWorkspace,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _savingProject 
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Create Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: widget.projects.isEmpty
          ? const Center(child: Text('No projects found. Add your first project workspace profile.', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: widget.projects.length,
              itemBuilder: (context, idx) {
                final p = widget.projects[idx];
                final isActive = widget.activeProject != null && widget.activeProject['_id'] == p['_id'];
                
                return Card(
                  color: isActive ? const Color(0xFFEEF2F6).withOpacity(0.4) : Colors.white,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: CircleAvatar(
                      backgroundColor: isActive ? const Color(0xFF4F46E5) : const Color(0xFFF1F5F9),
                      child: Icon(
                        Icons.folder_open_rounded, 
                        color: isActive ? Colors.white : const Color(0xFF4F46E5),
                        size: 20,
                      ),
                    ),
                    title: Text(p['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Code: ${p['code']} • Client: ${p['client'] ?? 'Internal'}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEEF2F6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              p['type'] == 'delivery' ? 'IMPLEMENTATION' : 'ONGOING SUPPORT',
                              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        isActive
                            ? const Chip(
                                label: Text('SELECTED', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white)),
                                backgroundColor: Color(0xFF4F46E5),
                                padding: EdgeInsets.zero,
                              )
                            : OutlinedButton(
                                onPressed: () => widget.onActivate(p),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                                  visualDensity: VisualDensity.compact,
                                ),
                                child: const Text('SELECT', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
                              ),
                        if (widget.currentUser['role'] == 'Admin' && !isActive) ...[
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                            onPressed: () => _deleteProjectWorkspace(p['_id']),
                            visualDensity: VisualDensity.compact,
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddProjectDialog,
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        mini: true,
        child: const Icon(Icons.create_new_folder_rounded),
      ),
    );
  }
}

extension ScaffoldMessengerExtension on ScaffoldMessengerState {
  void showToast(String message) {
    showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        backgroundColor: const Color(0xFF1E293B),
        margin: const EdgeInsets.only(bottom: 20, left: 16, right: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
