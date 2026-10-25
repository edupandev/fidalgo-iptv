@rem Gradle Wrapper Batch Script
@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle wrapper
@rem
@rem ##########################################################################

@setlocal

set APP_NAME=FidalGO-TV-Native
set APP_BASE_NAME=%~n0

@rem Resolve links
set PRG=%~f0
:resolve
if not "%PRG%"=="" (
    if exist "%PRG%" (
        for /f "delims=" %%i in ('dir /b /s "%PRG%" 2^>nul') do set PRG=%%i
    )
)
if not "%PRG%"=="" goto resolved
echo Could not find wrapper script
goto :EOF

:resolved
set APP_HOME=%~dp0
set CLASSPATH=%APP_HOME%gradle\wrapper\gradle-wrapper.jar

@rem Determine the Java command to use
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        set JAVA_EXE="%JAVA_HOME%\bin\java.exe"
    ) else if exist "%JAVA_HOME%\jre\bin\java.exe" (
        set JAVA_EXE="%JAVA_HOME%\jre\bin\java.exe"
    ) else (
        set JAVA_EXE=java
    )
) else (
    set JAVA_EXE=java
)

@rem JVM options
set DEFAULT_JVM_OPTS=-Xmx64m -Xms64m
set JAVA_OPTS=%DEFAULT_JVM_OPTS%

@rem Execute Gradle
%JAVA_EXE% %JAVA_OPTS% -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
@endlocal