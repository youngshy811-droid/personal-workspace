using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal static class PersonalWorkspaceApp
{
    private const string AppUrl = "http://127.0.0.1:3000/";

    [STAThread]
    private static void Main()
    {
        string appFolder = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        Log(appFolder, "launcher started");
        bool ready = IsReady();
        Log(appFolder, "initial server ready: " + ready);
        if (!ready)
        {
            StartServer(appFolder);
            for (int attempt = 0; attempt < 80 && !IsReady(); attempt++) Thread.Sleep(500);
        }

        ready = IsReady();
        Log(appFolder, "server ready before window: " + ready);
        if (!ready)
        {
            MessageBox.Show("启动失败，请把工作文件夹中的 startup.log 发给我检查。", "个人工作台", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Log(appFolder, "opening window");
        Application.Run(new WorkspaceWindow(appFolder));
    }

    private static void Log(string folder, string message)
    {
        try { File.AppendAllText(Path.Combine(folder, "desktop-host.log"), DateTime.Now.ToString("s") + " " + message + Environment.NewLine); }
        catch { }
    }

    private static bool IsReady()
    {
        try
        {
            var request = (HttpWebRequest)WebRequest.Create(AppUrl);
            request.Method = "GET";
            request.Proxy = null;
            request.Timeout = 900;
            request.ReadWriteTimeout = 900;
            using (var response = (HttpWebResponse)request.GetResponse())
                return (int)response.StatusCode >= 200 && (int)response.StatusCode < 500;
        }
        catch { return false; }
    }

    private static void StartServer(string appFolder)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = Environment.GetEnvironmentVariable("COMSPEC") ?? "cmd.exe",
            Arguments = "/c \"\"" + Path.Combine(appFolder, "background-service.cmd") + "\"\"",
            WorkingDirectory = appFolder,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden
        });
    }

    private sealed class WorkspaceWindow : Form
    {
        private readonly WebView2 webView = new WebView2();
        private readonly string appFolder;

        public WorkspaceWindow(string folder)
        {
            appFolder = folder;
            Log(appFolder, "window constructor");
            Text = "个人工作台";
            StartPosition = FormStartPosition.CenterScreen;
            WindowState = FormWindowState.Maximized;
            MinimumSize = new Size(960, 640);
            BackColor = Color.FromArgb(245, 250, 248);
            string iconPath = Path.Combine(appFolder, "PersonalWorkspace-final.ico");
            if (File.Exists(iconPath)) Icon = new Icon(iconPath);
            webView.Dock = DockStyle.Fill;
            Controls.Add(webView);
            Shown += InitializeWebView;
        }

        private async void InitializeWebView(object sender, EventArgs e)
        {
            try
            {
                Log(appFolder, "webview initialization started");
                string userData = Path.Combine(appFolder, ".wrangler", "webview2-profile");
                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, userData);
                await webView.EnsureCoreWebView2Async(environment);
                Log(appFolder, "webview initialized");
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.DocumentTitleChanged += delegate { Text = "个人工作台"; };
                webView.CoreWebView2.Navigate(AppUrl);
            }
            catch (Exception error)
            {
                Log(appFolder, "webview error: " + error);
                MessageBox.Show("窗口加载失败：" + error.Message, "个人工作台", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                Close();
            }
        }
    }
}
