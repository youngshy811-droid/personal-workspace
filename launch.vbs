Option Explicit
Dim shell, fso, appFolder, appUrl, edgePath, request, ready, i
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appFolder = fso.GetParentFolderName(WScript.ScriptFullName)
appUrl = "http://127.0.0.1:3000/"
ready = False
On Error Resume Next
Set request = CreateObject("WinHttp.WinHttpRequest.5.1")
request.Open "GET", appUrl, False
request.SetTimeouts 500, 500, 500, 800
request.Send
ready = (request.Status >= 200 And request.Status < 500)
On Error GoTo 0
If Not ready Then
  shell.Run "cmd.exe /c """ & appFolder & "\background-service.cmd""", 0, False
  For i = 1 To 80
    WScript.Sleep 500
    On Error Resume Next
    Set request = CreateObject("WinHttp.WinHttpRequest.5.1")
    request.Open "GET", appUrl, False
    request.SetTimeouts 300, 300, 300, 500
    request.Send
    ready = (request.Status >= 200 And request.Status < 500)
    On Error GoTo 0
    If ready Then Exit For
  Next
End If
If Not ready Then
  MsgBox "Personal Workspace could not start. Please check the startup log.", 48, "Personal Workspace"
  WScript.Quit 1
End If
edgePath = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe"
If fso.FileExists(edgePath) Then
  shell.Run """" & edgePath & """ --app=" & appUrl, 1, False
Else
  shell.Run appUrl, 1, False
End If
