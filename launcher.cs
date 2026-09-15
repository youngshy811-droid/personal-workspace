using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

internal static class PersonalWorkspaceLauncher
{
    private const string AppUrl = "http://127.0.0.1:3000/";

    [STAThread]
    private static void Main()
    {
        string appFolder = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        if (!IsReady())
        {
            StartServer(appFolder);
            for (int attempt = 0; attempt < 80 && !IsReady(); attempt++) Thread.Sleep(500);
        }

        if (!IsReady())
        {
            MessageBox.Show("启动失败，请把工作文件夹中的 startup.log 发给我检查。", "个人工作台", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        OpenAppWindow();
    }

    private static bool IsReady()
    {
        try
        {
            var request = (HttpWebRequest)WebRequest.Create(AppUrl);
            request.Method = "GET";
            request.Timeout = 900;
            request.ReadWriteTimeout = 900;
            using (var response = (HttpWebResponse)request.GetResponse())
                return (int)response.StatusCode >= 200 && (int)response.StatusCode < 500;
        }
        catch { return false; }
    }

    private static void StartServer(string appFolder)
    {
        var info = new ProcessStartInfo
        {
            FileName = Environment.GetEnvironmentVariable("COMSPEC") ?? "cmd.exe",
            Arguments = "/c \"\"" + Path.Combine(appFolder, "background-service.cmd") + "\"\"",
            WorkingDirectory = appFolder,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden
        };
        Process.Start(info);
    }

    private static void OpenAppWindow()
    {
        string edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
        if (File.Exists(edge))
            Process.Start(new ProcessStartInfo(edge, "--app=" + AppUrl) { UseShellExecute = true });
        else
            Process.Start(new ProcessStartInfo(AppUrl) { UseShellExecute = true });
    }
}
