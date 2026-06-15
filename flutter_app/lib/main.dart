import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SchoolErpApp());
}

class SchoolErpApp extends StatelessWidget {
  const SchoolErpApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aether ERP',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7C3AED),
          primary: const Color(0xFF7C3AED),
          secondary: const Color(0xFF10B981),
          background: const Color(0xFF0F172A),
        ),
        useMaterial3: true,
      ),
      home: const MainWebViewPage(),
    );
  }
}

class MainWebViewPage extends StatefulWidget {
  const MainWebViewPage({super.key});

  @override
  State<MainWebViewPage> createState() => _MainWebViewPageState();
}

class _MainWebViewPageState extends State<MainWebViewPage> {
  late final WebViewController _controller;
  String _currentUrl = 'http://10.0.2.2:3001'; // Default emulator localhost
  bool _isLoading = true;
  double _progress = 0;
  bool _showUrlConfig = false;
  final TextEditingController _urlInputController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F172A))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            setState(() {
              _progress = progress / 100.0;
            });
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('Web resource error: ${error.description}');
          },
        ),
      );
    _loadSavedUrl();
    _urlInputController.text = _currentUrl;
  }

  Future<void> _loadSavedUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString('saved_school_url');
      if (savedUrl != null && savedUrl.isNotEmpty) {
        setState(() {
          _currentUrl = savedUrl;
          _urlInputController.text = savedUrl;
        });
        _controller.loadRequest(Uri.parse(savedUrl));
      } else {
        _controller.loadRequest(Uri.parse(_currentUrl));
      }
    } catch (_) {
      _controller.loadRequest(Uri.parse(_currentUrl));
    }
  }

  Future<void> _saveUrl(String url) async {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://$url';
    }
    setState(() {
      _currentUrl = url;
      _urlInputController.text = url;
      _isLoading = true;
      _progress = 0;
    });
    
    _controller.loadRequest(Uri.parse(url));

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_school_url', url);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: _showUrlConfig
            ? TextField(
                controller: _urlInputController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: const InputDecoration(
                  hintText: 'Enter school server URL...',
                  hintStyle: TextStyle(color: Colors.white60),
                  border: InputBorder.none,
                ),
                onSubmitted: (value) {
                  _saveUrl(value);
                  setState(() {
                    _showUrlConfig = false;
                  });
                },
              )
            : const Row(
                children: [
                  Icon(Icons.school, color: Color(0xFF8B5CF6)),
                  SizedBox(width: 8),
                  Text(
                    'AETHER ERP',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
        actions: [
          IconButton(
            icon: Icon(_showUrlConfig ? Icons.check : Icons.edit_road),
            tooltip: _showUrlConfig ? 'Apply URL' : 'Configure Server URL',
            onPressed: () {
              if (_showUrlConfig) {
                _saveUrl(_urlInputController.text);
              }
              setState(() {
                _showUrlConfig = !_showUrlConfig;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Page',
            onPressed: () => _controller.reload(),
          ),
        ],
        bottom: _isLoading
            ? PreferredSize(
                preferredSize: const Size.fromHeight(2.0),
                child: LinearProgressIndicator(
                  value: _progress > 0 ? _progress : null,
                  backgroundColor: const Color(0xFF1E293B),
                  color: const Color(0xFF8B5CF6),
                ),
              )
            : null,
      ),
      body: WillPopScope(
        onWillPop: () async {
          if (await _controller.canGoBack()) {
            await _controller.goBack();
            return false;
          }
          return true;
        },
        child: Container(
          color: const Color(0xFF0F172A),
          child: WebViewWidget(controller: _controller),
        ),
      ),
    );
  }
}
