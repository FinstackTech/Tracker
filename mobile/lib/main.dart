import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
          IconButton(
            icon: const Icon(Icons.folder_shared_rounded, size: 20),
            tooltip: 'Doc Vault',
            onPressed: () {
              if (_activeProject != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => MobileDocVault(
                      baseUrl: widget.baseUrl,
                      activeProject: _activeProject,
                      currentUser: _activeSessionUser,
                    ),
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showToast('Please select a project first.');
              }
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

  void _showItemDetails(Map<String, dynamic> item, String type) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ItemDetailsSheet(
        baseUrl: widget.baseUrl,
        item: item,
        type: type,
        currentUser: widget.currentUser,
        onUpdate: _loadData,
      ),
    );
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
            onTap: () => _showItemDetails(t, 'task'),
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
            onTap: () => _showItemDetails(issue, 'issue'),
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

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE DOCUMENT VAULT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
class MobileDocVault extends StatefulWidget {
  final String baseUrl;
  final dynamic activeProject;
  final Map<String, String> currentUser;

  const MobileDocVault({
    super.key,
    required this.baseUrl,
    required this.activeProject,
    required this.currentUser,
  });

  @override
  State<MobileDocVault> createState() => _MobileDocVaultState();
}

class _MobileDocVaultState extends State<MobileDocVault> {
  List<dynamic> _documents = [];
  bool _loading = false;
  String _search = '';
  String _selectedCategory = 'All';
  
  final List<String> _categories = [
    'All',
    'Specifications',
    'Integrations',
    'Schemas',
    'Workspace wiki',
    'Templates'
  ];

  @override
  void initState() {
    super.initState();
    _fetchDocuments();
  }

  Future<void> _fetchDocuments() async {
    setState(() {
      _loading = true;
    });
    try {
      final projId = widget.activeProject['_id'];
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/documents?projectId=$projId'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _documents = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading documents: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _deleteDocument(String id) async {
    try {
      final res = await http.delete(Uri.parse('${widget.baseUrl}/api/documents?id=$id'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showToast('Document reference removed successfully.');
        }
        _fetchDocuments();
      }
    } catch (e) {
      debugPrint('Error deleting document: $e');
    }
  }

  void _showAddDocumentDialog() {
    final nameController = TextEditingController();
    final urlController = TextEditingController(text: 'https://');
    final descController = TextEditingController();
    String category = 'Specifications';
    String fileType = 'pdf';
    String fileSizeStr = '1.2 MB';

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
                        const Text('ATTACH REFERENCE DOCUMENT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                        IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded))
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Document Name', 
                        hintText: 'e.g. Bawatech API Spec',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))
                      ),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: category,
                            dropdownColor: Theme.of(context).cardColor,
                            decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                            style: TextStyle(fontSize: 11, color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.w600),
                            items: _categories.sublist(1).map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 11)))).toList(),
                            onChanged: (val) {
                              if (val != null) setDialogState(() => category = val);
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: fileType,
                            dropdownColor: Theme.of(context).cardColor,
                            decoration: const InputDecoration(labelText: 'Format', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                            style: TextStyle(fontSize: 11, color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.w600),
                            items: const [
                              DropdownMenuItem(value: 'pdf', child: Text('PDF')),
                              DropdownMenuItem(value: 'docx', child: Text('Word')),
                              DropdownMenuItem(value: 'xlsx', child: Text('Excel')),
                              DropdownMenuItem(value: 'json', child: Text('JSON')),
                              DropdownMenuItem(value: 'wiki', child: Text('Wiki Link')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setDialogState(() {
                                  fileType = val;
                                  if (fileType == 'wiki') {
                                    fileSizeStr = 'Wiki URL';
                                  } else {
                                    fileSizeStr = '1.2 MB';
                                  }
                                });
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            enabled: fileType != 'wiki',
                            decoration: const InputDecoration(labelText: 'Size Estimate', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            controller: TextEditingController(text: fileSizeStr)..selection = TextSelection.collapsed(offset: fileSizeStr.length),
                            onChanged: (val) {
                              fileSizeStr = val;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: urlController,
                            decoration: const InputDecoration(labelText: 'Reference URL', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descController,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Brief Description', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () async {
                        if (nameController.text.trim().isEmpty || urlController.text.trim().isEmpty) return;

                        double numVal = 1.2;
                        final match = RegExp(r'([0-9.]+)').firstMatch(fileSizeStr);
                        if (match != null) {
                          numVal = double.tryParse(match.group(1) ?? '1.2') ?? 1.2;
                        }
                        int sizeBytes = 0;
                        if (fileType != 'wiki') {
                          bool isKB = fileSizeStr.toLowerCase().contains('kb');
                          sizeBytes = isKB ? (numVal * 1024).round() : (numVal * 1024 * 1024).round();
                        }

                        final payload = {
                          'projectId': widget.activeProject['_id'],
                          'name': nameController.text.trim().endsWith('.$fileType') 
                              ? nameController.text.trim() 
                              : '${nameController.text.trim()}.$fileType',
                          'category': category,
                          'fileType': fileType,
                          'fileSize': fileType == 'wiki' ? 'Wiki URL' : fileSizeStr,
                          'sizeBytes': sizeBytes,
                          'owner': widget.currentUser['name'] ?? 'Superadmin',
                          'url': urlController.text.trim(),
                          'description': descController.text.trim().isEmpty 
                              ? 'No description provided.' 
                              : descController.text.trim(),
                        };

                        try {
                          final res = await http.post(
                            Uri.parse('${widget.baseUrl}/api/documents'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode(payload),
                          );
                          final data = jsonDecode(res.body);
                          if (data['success'] == true) {
                            if (mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showToast('Document reference attached!');
                            }
                            _fetchDocuments();
                          }
                        } catch (e) {
                          debugPrint('Error creating document: $e');
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Attach File Reference', style: TextStyle(fontWeight: FontWeight.bold)),
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

  Color _getFileColor(String fileType) {
    switch (fileType) {
      case 'pdf': return const Color(0xFFF43F5E);
      case 'docx': return const Color(0xFF3B82F6);
      case 'xlsx': return const Color(0xFF10B981);
      case 'json': return const Color(0xFFF59E0B);
      case 'wiki': return const Color(0xFF1E293B);
      default: return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _documents.where((doc) {
      final name = (doc['name'] ?? '').toString().toLowerCase();
      final desc = (doc['description'] ?? '').toString().toLowerCase();
      final cat = (doc['category'] ?? '').toString();
      
      final matchesSearch = name.contains(_search.toLowerCase()) || desc.contains(_search.toLowerCase());
      final matchesCat = _selectedCategory == 'All' || cat == _selectedCategory;
      
      return matchesSearch && matchesCat;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Document Vault', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: _showAddDocumentDialog,
          )
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search documents...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              onChanged: (val) {
                setState(() {
                  _search = val;
                });
              },
            ),
          ),
          // Category tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(cat, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    selected: isSelected,
                    selectedColor: const Color(0xFF4F46E5),
                    labelStyle: TextStyle(color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedCategory = cat;
                        });
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          // Documents List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? const Center(child: Text('No documents found.', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12.0),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final doc = filtered[idx];
                          final fileType = doc['fileType'] ?? 'pdf';
                          final fileColor = _getFileColor(fileType);

                          return Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              leading: Container(
                                height: 40,
                                width: 40,
                                decoration: BoxDecoration(
                                  color: fileColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Text(
                                    fileType.toString().toUpperCase(),
                                    style: TextStyle(color: fileColor, fontSize: 10, fontWeight: FontWeight.w900),
                                  ),
                                ),
                              ),
                              title: Text(doc['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${doc['category']} • ${doc['fileSize']} • ${doc['owner']}',
                                      style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(doc['description'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.copy_all_rounded, size: 20),
                                    onPressed: () {
                                      Clipboard.setData(ClipboardData(text: doc['url'] ?? ''));
                                      ScaffoldMessenger.of(context).showToast('Link copied to clipboard!');
                                    },
                                  ),
                                  if (widget.currentUser['role'] == 'Admin' || widget.currentUser['role'] == 'Head')
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (context) => AlertDialog(
                                            title: const Text('Delete Reference'),
                                            content: const Text('Are you sure you want to permanently delete this document reference?'),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.pop(context),
                                                child: const Text('Cancel'),
                                              ),
                                              TextButton(
                                                onPressed: () {
                                                  Navigator.pop(context);
                                                  _deleteDocument(doc['_id']);
                                                },
                                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE TASK & BUG DETAILS DRAWERS WITH SUBTASK TOGGLES & COMMENT FEEDS
// ─────────────────────────────────────────────────────────────────────────────
class ItemDetailsSheet extends StatefulWidget {
  final String baseUrl;
  final Map<String, dynamic> item;
  final String type; // 'task' or 'issue'
  final Map<String, String> currentUser;
  final VoidCallback onUpdate;

  const ItemDetailsSheet({
    super.key,
    required this.baseUrl,
    required this.item,
    required this.type,
    required this.currentUser,
    required this.onUpdate,
  });

  @override
  State<ItemDetailsSheet> createState() => _ItemDetailsSheetState();
}

class _ItemDetailsSheetState extends State<ItemDetailsSheet> {
  late Map<String, dynamic> _item;
  final _commentController = TextEditingController();
  bool _submittingComment = false;

  @override
  void initState() {
    super.initState();
    _item = Map<String, dynamic>.from(widget.item);
  }

  Future<void> _toggleSubtask(int index, bool completed) async {
    final subtasks = List<dynamic>.from(_item['subtasks'] ?? []);
    final Map<String, dynamic> subtask = Map<String, dynamic>.from(subtasks[index]);
    subtask['completed'] = completed;
    subtasks[index] = subtask;

    final path = widget.type == 'task' ? 'tasks' : 'issues';
    try {
      final res = await http.put(
        Uri.parse('${widget.baseUrl}/api/$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          '_id': _item['_id'],
          'subtasks': subtasks,
          'actor': widget.currentUser['name'],
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _item = data['data'];
        });
        widget.onUpdate();
      }
    } catch (e) {
      debugPrint('Error toggling subtask: $e');
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _submittingComment = true;
    });

    final comments = List<dynamic>.from(_item['comments'] ?? []);
    comments.add({
      'author': widget.currentUser['name'] ?? 'Superadmin',
      'text': text,
      'createdAt': DateTime.now().toIso8601String(),
    });

    final path = widget.type == 'task' ? 'tasks' : 'issues';
    try {
      final res = await http.put(
        Uri.parse('${widget.baseUrl}/api/$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          '_id': _item['_id'],
          'comments': comments,
          'actor': widget.currentUser['name'],
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        _commentController.clear();
        setState(() {
          _item = data['data'];
        });
        widget.onUpdate();
      }
    } catch (e) {
      debugPrint('Error posting comment: $e');
    } finally {
      setState(() {
        _submittingComment = false;
      });
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'critical': return const Color(0xFFBE123C);
      case 'high': return const Color(0xFFEF4444);
      case 'medium': return const Color(0xFFF59E0B);
      case 'low': return const Color(0xFF3B82F6);
      case 'lowest': return const Color(0xFF64748B);
      default: return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subtasks = _item['subtasks'] ?? [];
    final comments = _item['comments'] ?? [];
    final priority = _item['priority'] ?? 'medium';
    final status = _item['status'] ?? 'not-started';
    final isBlocked = _item['blocked'] == true;
    final storyPoints = _item['storyPoints'] != null ? (_item['storyPoints'] as num).toInt() : 0;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        top: 20,
        left: 20,
        right: 20,
      ),
      height: MediaQuery.of(context).size.height * 0.85,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Title & close
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  _item['title'] ?? '',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          // Badges
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getPriorityColor(priority).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  priority.toString().toUpperCase(),
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: _getPriorityColor(priority)),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status.toString().toUpperCase(),
                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5)),
                ),
              ),
              if (isBlocked)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'BLOCKED ⚠️',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.red),
                  ),
                ),
              if (storyPoints > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'SP: $storyPoints',
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                  ),
                ),
              if (_item['dueDate'] != null && _item['dueDate'].toString().isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Due: ${_item['dueDate']}',
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.orange),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          // Scrollable Body
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Description
                  const Text('DESCRIPTION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                  const SizedBox(height: 6),
                  Text(
                    _item['description'] != null && _item['description'].toString().isNotEmpty
                        ? _item['description']
                        : (_item['notes'] != null && _item['notes'].toString().isNotEmpty ? _item['notes'] : 'No description provided.'),
                    style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color),
                  ),
                  const SizedBox(height: 20),
                  
                  // Subtasks Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('SUBTASKS CHECKLIST', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                      Text('${subtasks.where((s) => s['completed'] == true).length}/${subtasks.length}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (subtasks.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text('No subtasks defined.', style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic)),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: subtasks.length,
                      itemBuilder: (context, idx) {
                        final sub = subtasks[idx];
                        final completed = sub['completed'] == true;
                        return CheckboxListTile(
                          value: completed,
                          title: Text(
                            sub['title'] ?? '',
                            style: TextStyle(
                              fontSize: 12, 
                              decoration: completed ? TextDecoration.lineThrough : null,
                              color: completed ? Colors.grey : Theme.of(context).textTheme.bodyMedium?.color,
                            ),
                          ),
                          contentPadding: EdgeInsets.zero,
                          dense: true,
                          controlAffinity: ListTileControlAffinity.leading,
                          onChanged: (val) {
                            if (val != null) {
                              _toggleSubtask(idx, val);
                            }
                          },
                        );
                      },
                    ),
                  const SizedBox(height: 20),

                  // Discussion Forum Section
                  const Text('DISCUSSION FORUM', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  if (comments.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12.0),
                      child: Text('No comments yet. Start the conversation!', style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic)),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: comments.length,
                      itemBuilder: (context, idx) {
                        final c = comments[idx];
                        String timeStr = '';
                        if (c['createdAt'] != null) {
                          try {
                            final dt = DateTime.parse(c['createdAt']);
                            timeStr = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
                          } catch (_) {}
                        }
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                radius: 12,
                                backgroundColor: const Color(0xFFEEF2F6),
                                child: Text(
                                  (c['author'] ?? 'U').toString().substring(0, 1).toUpperCase(),
                                  style: const TextStyle(fontSize: 9, color: Color(0xFF4F46E5), fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).cardColor,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.grey.withOpacity(0.15)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            c['author'] ?? 'Superadmin',
                                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyMedium?.color),
                                          ),
                                          if (timeStr.isNotEmpty)
                                            Text(
                                              timeStr,
                                              style: const TextStyle(fontSize: 8, color: Colors.grey),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        c['text'] ?? '',
                                        style: TextStyle(fontSize: 11, color: Theme.of(context).textTheme.bodyMedium?.color),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
          // Comment Input
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: _submittingComment
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send_rounded, color: Color(0xFF4F46E5)),
                  onPressed: _submittingComment ? null : _postComment,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
