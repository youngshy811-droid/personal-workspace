$ErrorActionPreference = 'Stop'
$appFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutName = (-join ([char[]](0x4E2A, 0x4EBA, 0x5DE5, 0x4F5C, 0x53F0))) + '.lnk'
$shortcutPath = Join-Path $desktop $shortcutName
$temporaryShortcutPath = Join-Path $desktop 'Personal Workspace.lnk'
$launcherPath = Join-Path $appFolder 'PersonalWorkspaceApp.exe'
$iconPath = Join-Path $appFolder 'PersonalWorkspace-final.ico'
$edgePath = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($temporaryShortcutPath)
$shortcut.TargetPath = $launcherPath
$shortcut.Arguments = ''
$shortcut.WorkingDirectory = $appFolder
$shortcut.Description = 'Personal Workspace - Local App'
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Save()
Move-Item -LiteralPath $temporaryShortcutPath -Destination $shortcutPath -Force
Write-Output $shortcutPath
