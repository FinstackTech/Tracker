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
                        color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
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
                style: TextStyle(color: Colors.grey, fontSize: 13),
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
                keyboardType: TextInputType.url,
              ),
              if (_errorMessage.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _errorMessage,
                  style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600),
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
  final List<Map<String, String>> _profiles = [
    {'name': 'Superadmin', 'role': 'Admin', 'email': 'superadmin@company.com'},
    {'name': 'Ilyas', 'role': 'Director', 'email': 'ilyas@company.com'},
    {'name': 'Susanth', 'role': 'Lead Architect', 'email': 'susanth@company.com'},
    {'name': 'Vishnu', 'role': 'Developer', 'email': 'vishnu@company.com'},
    {'name': 'Tom', 'role': 'Product Manager', 'email': 'tom@company.com'},
    {'name': 'HR Manager', 'role': 'HR', 'email': 'hr@company.com'},
  ];

  late Map<String, String> _selectedProfile;
  bool _signingIn = false;

  @override
  void initState() {
    super.initState();
    _selectedProfile = _profiles[0];
  }

  void _performLogin() {
    setState(() {
      _signingIn = true;
    });
    
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CockpitHomeScreen(
              baseUrl: widget.baseUrl,
              currentUser: _selectedProfile,
            ),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
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
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'Select a security profile to sign into the Finstack PPM network.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                  borderRadius: BorderRadius.circular(12),
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
                            Text('${prof['role']} • ${prof['email']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
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

  const CockpitHomeScreen({
    super.key,
    required this.baseUrl,
    required this.currentUser,
  });

  @override
  State<CockpitHomeScreen> createState() => _CockpitHomeScreenState();
}

class _CockpitHomeScreenState extends State<CockpitHomeScreen> {
  int _currentIndex = 0;
  List<dynamic> _projects = [];
  dynamic _activeProject;
  bool _loadingProjects = true;

  @override
  void initState() {
    super.initState();
    _fetchProjects();
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
            _activeProject = _projects[0];
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

  @override
  Widget build(BuildContext context) {
    final screens = [
      MobileBentoDashboard(baseUrl: widget.baseUrl, activeProject: _activeProject),
      MobileTasksBoard(baseUrl: widget.baseUrl, activeProject: _activeProject, currentUser: widget.currentUser),
      MobileDailyLogs(baseUrl: widget.baseUrl, activeProject: _activeProject, currentUser: widget.currentUser),
      MobileIssuesTracker(baseUrl: widget.baseUrl, activeProject: _activeProject),
      MobileLeavesPlanner(baseUrl: widget.baseUrl, currentUser: widget.currentUser),
    ];

    return Scaffold(
      appBar: AppBar(
        title: _loadingProjects 
          ? const Text('Loading Cockpit...', style: TextStyle(fontSize: 14))
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
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(proj['code'] ?? '', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
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
            icon: const Icon(Icons.refresh, size: 20),
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
                widget.currentUser['name']!.substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          )
        ],
      ),
      body: _activeProject == null 
        ? const Center(child: Text('Please select or create a project workspace.'))
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
          selectedFontSize: 10,
          unselectedFontSize: 10,
          onTap: (idx) {
            setState(() {
              _currentIndex = idx;
            });
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Bento'),
            BottomNavigationBarItem(icon: Icon(Icons.check_box_outlined), label: 'Tasks'),
            BottomNavigationBarItem(icon: Icon(Icons.assignment_turned_in_outlined), label: 'Standup'),
            BottomNavigationBarItem(icon: Icon(Icons.bug_report_outlined), label: 'Issues'),
            BottomNavigationBarItem(icon: Icon(Icons.calendar_month_outlined), label: 'Leaves'),
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
    if (widget.activeProject == null) return;
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

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DELIVERY METRIC PROGRESS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${_completionRate.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF4F46E5))),
                      Text('$_completedTasks / $_totalTasks Tasks Done', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
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
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.bug_report, color: Colors.redAccent, size: 24),
                        const SizedBox(height: 12),
                        const Text('Active Bugs', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('$_openBugs Bugs', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
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
                        const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 24),
                        const SizedBox(height: 12),
                        const Text('Scope Items', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('$_totalTasks Items', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('COCKPIT STATUS INFO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  _buildStatusRow('Active Client', widget.activeProject['client'] ?? 'Internal'),
                  const Divider(height: 16),
                  _buildStatusRow('Delivery Mode', widget.activeProject['type'] == 'delivery' ? 'Implementation' : 'Maintenance'),
                  const Divider(height: 16),
                  _buildStatusRow('Status', (widget.activeProject['status'] ?? '').toString().toUpperCase()),
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
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
      ],
    );
  }
}

class MobileTasksBoard extends StatefulWidget {
  final String baseUrl;
  final dynamic activeProject;
  final Map<String, String> currentUser;

  const MobileTasksBoard({
    super.key,
    required this.baseUrl,
    required this.activeProject,
    required this.currentUser,
  });

  @override
  State<MobileTasksBoard> createState() => _MobileTasksBoardState();
}

class _MobileTasksBoardState extends State<MobileTasksBoard> {
  List<dynamic> _tasks = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  @override
  void didUpdateWidget(covariant MobileTasksBoard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeProject != widget.activeProject) {
      _loadTasks();
    }
  }

  Future<void> _loadTasks() async {
    if (widget.activeProject == null) return;
    setState(() {
      _loading = true;
    });
    try {
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/tasks?projectId=${widget.activeProject['_id']}'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _tasks = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading tasks: $e');
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
        _loadTasks();
      }
    } catch (e) {
      debugPrint('Error updating task: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_tasks.isEmpty) {
      return const Center(child: Text('No tasks created for this project yet.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12.0),
      itemCount: _tasks.length,
      itemBuilder: (context, idx) {
        final t = _tasks[idx];
        if (t['type'] == 'heading') {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
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
              isDone ? Icons.check_circle : Icons.circle_outlined,
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
            subtitle: Row(
              children: [
                if (t['owner'] != null && t['owner'].toString().isNotEmpty) ...[
                  Text('Owner: ${t['owner']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  const SizedBox(width: 8),
                ],
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
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
            trailing: PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 20),
              onSelected: (val) {
                _updateTaskStatus(t['_id'], val);
              },
              itemBuilder: (context) {
                return [
                  const PopupMenuItem(value: 'not-started', child: Text('Not Started', style: TextStyle(fontSize: 12))),
                  const PopupMenuItem(value: 'in-progress', child: Text('In Progress', style: TextStyle(fontSize: 12))),
                  const PopupMenuItem(value: 'in-sit', child: Text('In SIT', style: TextStyle(fontSize: 12))),
                  const PopupMenuItem(value: 'in-uat', child: Text('In UAT', style: TextStyle(fontSize: 12))),
                  const PopupMenuItem(value: 'done', child: Text('Mark Done ✅', style: TextStyle(fontSize: 12))),
                ];
              },
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
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.all(10),
                    ),
                    style: const TextStyle(fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _hoursController,
                          decoration: const InputDecoration(
                            labelText: 'Hours',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.all(10),
                          ),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _status,
                          decoration: const InputDecoration(
                            labelText: 'Status',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                          ),
                          style: const TextStyle(fontSize: 12),
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
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(10),
                      ),
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _submitLog,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
                              style: const TextStyle(fontSize: 10, color: Colors.grey),
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

class MobileIssuesTracker extends StatefulWidget {
  final String baseUrl;
  final dynamic activeProject;

  const MobileIssuesTracker({super.key, required this.baseUrl, required this.activeProject});

  @override
  State<MobileIssuesTracker> createState() => _MobileIssuesTrackerState();
}

class _MobileIssuesTrackerState extends State<MobileIssuesTracker> {
  List<dynamic> _issues = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadIssues();
  }

  @override
  void didUpdateWidget(covariant MobileIssuesTracker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeProject != widget.activeProject) {
      _loadIssues();
    }
  }

  Future<void> _loadIssues() async {
    if (widget.activeProject == null) return;
    setState(() {
      _loading = true;
    });
    try {
      final res = await http.get(Uri.parse('${widget.baseUrl}/api/issues?projectId=${widget.activeProject['_id']}'));
      final data = jsonDecode(res.body);
      if (data['success'] == true) {
        setState(() {
          _issues = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading issues: $e');
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

    if (_issues.isEmpty) {
      return const Center(child: Text('All clear! Zero active bugs reported.'));
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
                  Text(issue['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 11, color: Colors.grey)),
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

class MobileLeavesPlanner extends StatefulWidget {
  final String baseUrl;
  final Map<String, String> currentUser;

  const MobileLeavesPlanner({super.key, required this.baseUrl, required this.currentUser});

  @override
  State<MobileLeavesPlanner> createState() => _MobileLeavesPlannerState();
}

class _MobileLeavesPlannerState extends State<MobileLeavesPlanner> {
  List<dynamic> _leaves = [];
  bool _loading = false;
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
      _loading = true;
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
        _loading = false;
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
          ScaffoldMessenger.of(context).showToast('Vacation request registered!');
        }
      }
    } catch (e) {
      debugPrint('Error submitting leave: $e');
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
                  const Text('REQUEST CAPACITY LEAVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _startController,
                          decoration: const InputDecoration(
                            labelText: 'Start Date',
                            hintText: 'YYYY-MM-DD',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.all(10),
                          ),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _endController,
                          decoration: const InputDecoration(
                            labelText: 'End Date',
                            hintText: 'YYYY-MM-DD',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.all(10),
                          ),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _leaveType,
                    decoration: const InputDecoration(
                      labelText: 'Type of Leave',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    ),
                    style: const TextStyle(fontSize: 12),
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
                      hintText: 'e.g. Summer family vacation block...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.all(10),
                    ),
                    style: const TextStyle(fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _submitLeave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Submit Request', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
          child: _loading 
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  itemCount: _leaves.length,
                  itemBuilder: (context, idx) {
                    final l = _leaves[idx];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: ListTile(
                        leading: const Icon(Icons.flight_takeoff, color: Color(0xFF4F46E5)),
                        title: Text(l['employeeName'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          '${l['startDate']} to ${l['endDate']} (${l['daysCount']} days) • ${l['notes'] ?? ''}',
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
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

extension ScaffoldMessengerExtension on ScaffoldMessengerState {
  void showToast(String message) {
    showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
