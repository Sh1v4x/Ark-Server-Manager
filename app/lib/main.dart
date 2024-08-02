import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'config.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ark Server Manager',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      debugShowCheckedModeBanner: false,
      home: const ArkServerListPage(),
    );
  }
}

class ServerItem {
  final String name;
  String status;
  final String imageUrl;

  ServerItem(
      {required this.name, required this.status, required this.imageUrl});

  factory ServerItem.fromJson(Map<String, dynamic> json) {
    return ServerItem(
        name: json['name'], status: json['status'], imageUrl: json['img']);
  }
}

// List page for displaying server items
class ArkServerListPage extends StatefulWidget {
  const ArkServerListPage({super.key});

  @override
  State<ArkServerListPage> createState() => _ArkServerListPageState();
}

class _ArkServerListPageState extends State<ArkServerListPage> {
  List<ServerItem> serverItems = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _refreshServerStatus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ArkServerManager'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshServerStatus,
          ),
          IconButton(
            icon: const Icon(Icons.system_update),
            onPressed: _updateServer,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: serverItems.length,
              itemBuilder: (context, index) {
                final serverItem = serverItems[index];
                return InkWell(
                  onTap: () => _showServerDialog(context, serverItem),
                  child: ListTile(
                    leading: Image.network(serverItem.imageUrl,
                        width: 50, height: 50, fit: BoxFit.cover),
                    title: Text(serverItem.name),
                    subtitle: Text(serverItem.status),
                    trailing: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _getStatusColor(serverItem.status),
                      ),
                    ),
                    contentPadding: const EdgeInsets.all(8.0),
                  ),
                );
              },
            ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'running':
        return Colors.green;
      case 'starting':
        return Colors.orange;
      case 'stopped':
        return Colors.red;
      case 'updating':
        return Colors.yellow;
      default:
        return Colors.grey;
    }
  }

  void _showServerDialog(BuildContext context, ServerItem serverItem) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(serverItem.name),
          content: Text(
              'The server is currently ${serverItem.status}. What would you like to do?'),
          actions: <Widget>[
            if (serverItem.status == 'running')
              TextButton(
                onPressed: () {
                  _stopServer(serverItem.name);
                  Navigator.of(context).pop();
                },
                child: const Text('Stop Server'),
              ),
            if (serverItem.status == 'stopped')
              TextButton(
                onPressed: () {
                  _startServer(serverItem.name);
                  Navigator.of(context).pop();
                },
                child: const Text('Start Server'),
              ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _refreshServerStatus() async {
    setState(() {
      _isLoading = true;
    });

    print('Refreshing server status...');
    final url = Uri.parse('${Config.apiUrl}/servers');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          serverItems = data.map((item) => ServerItem.fromJson(item)).toList();
        });
      } else {
        throw Exception('Failed to load server status');
      }
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _startServer(String serverName) async {
    final url = Uri.parse('${Config.apiUrl}/start/$serverName');
    try {
      final response = await http.post(url);

      if (response.statusCode == 200) {
        setState(() {
          serverItems.firstWhere((item) => item.name == serverName).status =
              'starting';
        });
        _refreshServerStatus();
      } else {
        throw Exception('Failed to start server');
      }
    } catch (e) {
      print('Error: $e');
      // Handle error appropriately here
    }
  }

  Future<void> _stopServer(String serverName) async {
    final url = Uri.parse('${Config.apiUrl}/stop/$serverName');
    try {
      final response = await http.post(url);

      if (response.statusCode == 200) {
        setState(() {
          serverItems.firstWhere((item) => item.name == serverName).status =
              'stopping';
        });
        _refreshServerStatus();
      } else {
        throw Exception('Failed to stop server');
      }
    } catch (e) {
      print('Error: $e');
      // Handle error appropriately here
    }
  }

  Future<void> _updateServer() async {
    final url = Uri.parse('${Config.apiUrl}/update');
    try {
      setState(() {
        for (var server in serverItems) {
          server.status = 'updating';
        }
      });

      final response = await http.post(url);

      if (response.statusCode == 200) {
        print("Server update successful");

        _refreshServerStatus();
      } else {
        throw Exception('Failed to update servers');
      }
    } catch (e) {
      print('Error: $e');
      // Handle error appropriately here
    }
  }
}
