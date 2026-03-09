
#NoEnv
#SingleInstance Force
#Persistent
SendMode Input
SetTitleMatchMode, 2
CoordMode, Mouse, Screen

; =========================
; 전역 변수
; =========================
global ExcelDataCache := {}
global MAX_ROWS := 1000
global WAIT_LOADING_MS := 60000

; 버튼 탐색용
global BTN_ADDROW_NAME := "행추가"
global BTN_ADDROW_ID   := ""
global BTN_SAVE_NAME   := "저장"
global BTN_SAVE_ID     := ""
global BTN_IMAGE_TEXT  := "IMAGE"   ; IMAGE 버튼 (class: NUI-btn-partial01, 텍스트: IMAGE 추가)
global TEST_URL := "http://nexusui.samsungfire.com/nexusUi/page/NPGEFCB00036.do?IV_CLAIM=02202503283173401&IV_TYPE=2&IS_POPUP=true&POPUP_SIZE=custom"
global TEST_URL_BASE := "http://nexusui.samsungfire.com/nexusUi/page/NPGEFCB00036.do"

; 클립보드 이력 (첫번째=최신→NUI-find, 두번째=직전→IV_CLAIM)
global g_currClipboard := ""
global g_prevClipboard := ""

; 사용자 설정 단축키 (기본 F2, F3, F4, ini에서 로드)
global g_hotkey1 := "F2"
global g_hotkey2 := "F3"
global g_hotkey3 := "F4"
global g_iniPath := A_ScriptDir "\진행관리종합매크로.ini"

; 문장 삽입용 (포커스된 인풋에 텍스트 삽입)
global g_phraseTargetHwnd := 0
global g_lastExternalHwnd := 0

; 손해사정서 자동기입용
global g_contactValue := ""
global g_phraseDamageSurveyMode := false
global g_phraseForDamageSurveyTitle := ""   ; 관계 법규 및 약관에 입력
global g_phraseForDamageSurveyContent := "" ; 세부내용에 입력

; 새창열기 (Ctrl+클릭 → 16자리 코드 새 창)
global g_newWindowEnabled := true
global g_targetURL := "https://nexusui.samsungfire.com/nexusUi/page/NPGEFCC21000.do?IV_CCEVENT=***"
global g_waitTimeNewWindow := 800

; IE 캐시 자동 제거 (유휴 30분 이상 시 TIF 삭제, 4시간 쿨다운)
global g_cacheCleanerEnabled := true
global g_cacheIdleMinutes := 30
global g_cacheCooldownMinutes := 240
global g_cacheLastCleanTime := "00000000000000"

; =========================
; 시스템 트레이 설정
; =========================
Menu, Tray, Tip, 진행관리 종합매크로 - DOM 자동화
Menu, Tray, NoStandard
Menu, Tray, Add, 열기, TrayShow
Menu, Tray, Add
Menu, Tray, Add, IE 캐시 자동제거 ON/OFF, TrayToggleCacheCleaner
Menu, Tray, Add
Menu, Tray, Add, 종료, TrayExit
Menu, Tray, Default, 열기
Menu, Tray, Click, 1

; =========================
; 시작
; =========================
LoadHotkeysFromIni()
LoadContactFromIni()
LoadNewWindowFromIni()
LoadCacheCleanerFromIni()
CreateMainGUI()
g_currClipboard := Clipboard
SetTimer, ClipSnapshot, 300
SetTimer, StoreLastWindow, 500
SetTimer, SaveContactIfChanged, 2000  ; 연락처 변경 시 2초마다 자동 저장
SetTimer, CacheCleanerCheck, 60000    ; 60초마다 IE 캐시 제거 조건 확인
RegisterHotkeys()  ; 초기 단축키 등록
return

; 연락처 입력값이 변경되면 ini에 자동 저장
SaveContactIfChanged:
    global ContactEdit, g_contactValue, g_iniPath
    Gui, Main:Submit, NoHide
    if (ContactEdit != "" && ContactEdit != g_contactValue) {
        g_contactValue := ContactEdit
        IniWrite, %g_contactValue%, %g_iniPath%, DamageSurvey, Contact
    }
return

; 클립보드 스냅샷 (최신/직전 구분)
ClipSnapshot:
    if (Clipboard != g_currClipboard) {
        g_prevClipboard := g_currClipboard
        g_currClipboard := Clipboard
    }
return

; IE 캐시 자동 제거 (유휴 30분 이상 + 4시간 쿨다운 시 TIF만 삭제)
CacheCleanerCheck:
    global g_cacheCleanerEnabled, g_cacheIdleMinutes, g_cacheCooldownMinutes, g_cacheLastCleanTime, g_iniPath
    if (!g_cacheCleanerEnabled)
        return
    idleMs := A_TimeIdle
    idleMinutes := idleMs / 60000
    if (idleMinutes < g_cacheIdleMinutes)
        return
    cooldownDiff := A_Now
    EnvSub, cooldownDiff, %g_cacheLastCleanTime%, Minutes
    if (cooldownDiff < g_cacheCooldownMinutes)
        return
    RunWait, rundll32.exe InetCpl.cpl`,ClearMyTracksByProcess 8,, Hide
    g_cacheLastCleanTime := A_Now
    IniWrite, %g_cacheLastCleanTime%, %g_iniPath%, CacheCleaner, LastCleanTime
    ToolTip, IE 캐시 자동 제거 완료 (유휴 %idleMinutes%분)
    SetTimer, RemoveToolTip, -3000
return

; =========================
; 메인 GUI
; =========================
CreateMainGUI() {
    global Hotkey1, Hotkey2, Hotkey3, MaxRowsEdit, ContactEdit, g_targetURL, g_waitTimeNewWindow
    Gui, Main:New, +AlwaysOnTop, 진행관리 종합매크로 - DOM 자동화
    Gui, Main:Font, s10, 맑은 고딕

    Gui, Main:Add, GroupBox, x10 y10 w395 h240, 자동화 (Edge 창 포커스 후 단축키 권장)
    Gui, Main:Add, Text, x20 y38 w55 h20, 단축키
    Gui, Main:Add, Hotkey, x75 y35 w70 h25 vHotkey1, %g_hotkey1%
    Gui, Main:Add, Button, x155 y33 w225 h28 gBtnRunAll, 72,PN,F2 자동기입
    Gui, Main:Add, Text, x20 y73 w55 h20, 단축키
    Gui, Main:Add, Hotkey, x75 y70 w70 h25 vHotkey2, %g_hotkey2%
    Gui, Main:Add, Button, x155 y68 w225 h28 gBtnF7Combo, 결제의견 기입
    Gui, Main:Add, Text, x20 y108 w55 h20, 단축키
    Gui, Main:Add, Hotkey, x75 y105 w70 h25 vHotkey3, %g_hotkey3%
    Gui, Main:Add, Button, x155 y103 w225 h28 gBtnDamageSurvey, 손해사정서 자동기입
    Gui, Main:Add, Text, x20 y143 w120 h20, 최대 인식엑셀 갯수
    Gui, Main:Add, Edit, x145 y140 w90 h25 vMaxRowsEdit, %MAX_ROWS%
    Gui, Main:Add, Text, x20 y178 w50 h20, 연락처
    Gui, Main:Add, Edit, x75 y175 w305 h25 vContactEdit, %g_contactValue%

    Gui, Main:Add, Button, x20 y215 w120 h28 gBtnSaveHotkeys, 단축키 저장
    Gui, Main:Add, Button, x280 y215 w120 h28 gGuiClose, 종료

    Gui, Main:Add, GroupBox, x10 y252 w395 h82, 새창열기 (Ctrl+클릭 시 16자리 → 새 창)
    Gui, Main:Add, Text, x20 y272 w80 h20, URL (***=코드)
    Gui, Main:Add, Edit, x20 y290 w375 h21 vGuiNewWindowUrl, %g_targetURL%
    Gui, Main:Add, Text, x20 y316 w50 h20, 대기(ms)
    Gui, Main:Add, Edit, x70 y313 w60 h21 Number vGuiNewWindowWaitTime, %g_waitTimeNewWindow%
    Gui, Main:Add, Text, x140 y316 cGray, F6 ON/OFF

    Gui, Main:Show, w420 h345
    
    ; 최소화 이벤트 감지 (0x0112 = WM_SYSCOMMAND, 0xF020 = SC_MINIMIZE)
    OnMessage(0x0112, "WM_SYSCOMMAND")
}

; 최소화/닫기 버튼 처리
WM_SYSCOMMAND(wParam, lParam, msg, hwnd) {
    static SC_MINIMIZE := 0xF020
    static SC_CLOSE := 0xF060
    
    ; 최소화 버튼 → 트레이로 이동
    if (wParam = SC_MINIMIZE) {
        Gui, Main:Hide
        return 0  ; 기본 최소화 동작 방지
    }
    
    ; X 버튼 (닫기) → 바로 종료
    if (wParam = SC_CLOSE) {
        ExitApp
        return 0
    }
}

; 트레이 아이콘 클릭 시 GUI 표시
TrayShow:
    Gui, Main:Show
return

; IE 캐시 자동제거 ON/OFF 토글 (트레이 메뉴)
TrayToggleCacheCleaner:
    global g_cacheCleanerEnabled, g_iniPath
    g_cacheCleanerEnabled := !g_cacheCleanerEnabled
    IniWrite, %g_cacheCleanerEnabled%, %g_iniPath%, CacheCleaner, Enabled
    if (g_cacheCleanerEnabled)
        ToolTip, IE 캐시 자동제거 ON (유휴 30분 시 삭제)
    else
        ToolTip, IE 캐시 자동제거 OFF
    SetTimer, RemoveToolTip, -1500
return

; 트레이에서 종료
TrayExit:
    ExitApp
return

; X 버튼 클릭 시 바로 종료
GuiClose:
    ExitApp
return

; =========================
; 단축키 저장 버튼 클릭
; =========================
BtnSaveHotkeys:
    Gui, Main:Submit, NoHide
    global Hotkey1, Hotkey2, Hotkey3, g_hotkey1, g_hotkey2, g_hotkey3, g_iniPath, ContactEdit, g_contactValue
    global GuiNewWindowUrl, GuiNewWindowWaitTime, g_targetURL, g_waitTimeNewWindow
    old1 := g_hotkey1
    old2 := g_hotkey2
    old3 := g_hotkey3
    n1 := Trim(Hotkey1)
    n2 := Trim(Hotkey2)
    n3 := Trim(Hotkey3)
    if (n1 != "")
        g_hotkey1 := n1
    if (n2 != "")
        g_hotkey2 := n2
    if (n3 != "")
        g_hotkey3 := n3
    ; 기존 단축키 해제 후 새 단축키 등록
    Hotkey, %old1%, BtnRunAll, Off
    Hotkey, %old2%, BtnF7Combo, Off
    Hotkey, %old3%, BtnDamageSurvey, Off
    Hotkey, %g_hotkey1%, BtnRunAll, On
    Hotkey, %g_hotkey2%, BtnF7Combo, On
    Hotkey, %g_hotkey3%, BtnDamageSurvey, On
    ; ini 파일에 저장 (재실행 시 로드)
    IniWrite, %g_hotkey1%, %g_iniPath%, Hotkeys, Key1
    IniWrite, %g_hotkey2%, %g_iniPath%, Hotkeys, Key2
    IniWrite, %g_hotkey3%, %g_iniPath%, Hotkeys, Key3
    if (ContactEdit != "")
        g_contactValue := ContactEdit
    if (g_contactValue != "")
        IniWrite, %g_contactValue%, %g_iniPath%, DamageSurvey, Contact
    ; 새창열기 설정 저장
    if (GuiNewWindowUrl != "") {
        g_targetURL := GuiNewWindowUrl
        IniWrite, %g_targetURL%, %g_iniPath%, NewWindow, TargetURL
    }
    if (GuiNewWindowWaitTime != "") {
        g_waitTimeNewWindow := GuiNewWindowWaitTime
        IniWrite, %g_waitTimeNewWindow%, %g_iniPath%, NewWindow, WaitTime
    }
    ToolTip, 단축키가 저장되었습니다.
    SetTimer, RemoveToolTip, 1500
return

RemoveToolTip:
    SetTimer, RemoveToolTip, Off
    ToolTip
return

; =========================
; 새창열기: F6 ON/OFF, Ctrl+클릭 → 더블클릭·복사로 16자리 검증 후 새 창
; =========================
ToggleNewWindowMacro:
    global g_newWindowEnabled
    g_newWindowEnabled := !g_newWindowEnabled
    if (g_newWindowEnabled) {
        Hotkey, ^LButton, NewWindowOnCtrlClick, On
        SoundBeep, 1000, 150
        ToolTip, [새창열기 ON]
    } else {
        Hotkey, ^LButton, NewWindowOnCtrlClick, Off
        SoundBeep, 500, 150
        ToolTip, [새창열기 OFF]
    }
    SetTimer, RemoveToolTip, -1200
return

NewWindowOnCtrlClick:
    global g_targetURL, g_waitTimeNewWindow
    ; 1. 더블클릭 및 복사
    SendInput, {Click}
    Sleep, 30
    SendInput, {Click, 2}
    Sleep, 50

    Clipboard := ""
    SendInput, ^c
    ClipWait, 0.4

    if (ErrorLevel) {
        ToolTip, 복사 실패
        SetTimer, RemoveToolTip, -1000
        return
    }

    ; 2. 데이터 정제 (공백 제거, 하이픈 유지)
    RawText := Clipboard
    TempText := RegExReplace(RawText, "\s")

    ; 3. 16자리 검증
    if (StrLen(TempText) = 16 && RegExMatch(TempText, "^[\d-]+$")) {
        SoundBeep, 700, 100

        CleanCode := StrReplace(TempText, "-")
        if (InStr(g_targetURL, "***"))
            FinalURL := StrReplace(g_targetURL, "***", CleanCode)
        else
            FinalURL := g_targetURL . CleanCode

        ; 4. 새 창 열기 (Ctrl+N 방식)
        Clipboard := FinalURL
        hwnd := WinActive("A")
        WinActivate, ahk_id %hwnd%
        Sleep, 100

        SendInput, ^n
        Sleep, %g_waitTimeNewWindow%
        SendInput, !d
        Sleep, 120
        SendInput, ^v
        Sleep, 120
        SendInput, {Enter}

        SoundBeep, 1000, 150
    } else {
        Len := StrLen(TempText)
        if (Len > 0) {
            ToolTip, 인식 실패 (%Len%자리/16자리)`n내용: %TempText%
            SetTimer, RemoveToolTip, -1500
        }
        SendInput, {Click}
    }
return

; =========================
; 손해사정서 자동기입 - 연락처→관계법규→세부내용
; =========================
BtnDamageSurvey:
    Gui, Main:Submit, NoHide
    global ContactEdit, g_contactValue, g_phraseDamageSurveyMode, g_phraseForDamageSurveyTitle, g_phraseForDamageSurveyContent, g_lastExternalHwnd, g_iniPath
    hwndNow := WinExist("A")
    try {
        WinGet, procName, ProcessName, ahk_id %hwndNow%
        if (procName != "AutoHotkey.exe" && procName != "AutoHotkeyU64.exe" && procName != "AutoHotkeyU32.exe")
            g_lastExternalHwnd := hwndNow
    }
    contactVal := Trim(ContactEdit)
    if (contactVal = "") {
        MsgBox, 48, 오류, 연락처를 입력하세요.
        return
    }
    ; 연락처 사용 시 즉시 저장 (지속 보존)
    g_contactValue := contactVal
    IniWrite, %g_contactValue%, %g_iniPath%, DamageSurvey, Contact
    wb := GetActiveIEWindow()
    if (!wb && g_lastExternalHwnd) {
        doc := GetIEModeDocumentFromEdgeWindow(g_lastExternalHwnd)
        if (IsObject(doc))
            wb := { document: doc }
    }
    if (!wb) {
        MsgBox, 48, 오류, Edge IE 모드 창을 찾을 수 없습니다.`n`n손해사정서 페이지가 열린 Edge 창을 포커스한 뒤 설정된 단축키(%g_hotkey3%)를 누르세요.
        return
    }
    hwndEdge := g_lastExternalHwnd

    ; ① 연락처 (아랫쪽 인풋) - 저장값 입력
    if (!FocusInputBelowText(wb, "연락처")) {
        MsgBox, 48, 오류, "연락처" 텍스트 아랫쪽의 입력창을 찾을 수 없습니다.
        return
    }
    Sleep, 100
    SendInput, ^a
    Sleep, 100
    Clipboard := contactVal
    Sleep, 100
    SendInput, ^v
    Sleep, 100

    ; ② 관계 법규 및 약관 (우측 인풋) - 문장삽입 GUI 띄워 선택 입력
    if (!FocusInputRightOfText(wb, "관계 법규 및 약관")) {
        MsgBox, 48, 오류, "관계 법규 및 약관" 텍스트 우측의 입력창을 찾을 수 없습니다.
        return
    }
    Sleep, 100
    g_phraseDamageSurveyMode := true
    g_phraseForDamageSurveyTitle := ""
    g_phraseForDamageSurveyContent := ""
    ShowPhraseInsertGUINow()
    ; 사용자 선택 대기
    Loop, 150 {
        Sleep, 100
        if (g_phraseForDamageSurveyTitle != "" || g_phraseForDamageSurveyContent != "")
            break
    }
    g_phraseDamageSurveyMode := false
    if (g_phraseForDamageSurveyTitle = "" && g_phraseForDamageSurveyContent = "") {
        MsgBox, 48, 안내, 문장을 선택하지 않아 관계 법규 입력을 건너뜁니다.
    } else {
        if (hwndEdge) {
            WinActivate, ahk_id %hwndEdge%
            Sleep, 100
        }
        ; 관계 법규 및 약관에는 TITLE 입력
        if (FocusInputRightOfText(wb, "관계 법규 및 약관")) {
            Sleep, 100
            Clipboard := g_phraseForDamageSurveyTitle
            Sleep, 100
            SendInput, ^v
            Sleep, 100
        }
    }

    ; ③ 세부내용 - "선택" 버튼 우측 인풋에 문장삽입에서 선택한 CONTENT 복붙
    if (!FocusInputRightOfButtonByText(wb, "선택")) {
        MsgBox, 48, 오류, "선택" 버튼 우측의 입력창을 찾을 수 없습니다.
        return
    }
    Sleep, 100
    if (g_phraseForDamageSurveyContent != "") {
        Clipboard := g_phraseForDamageSurveyContent
        Sleep, 100
        SendInput, ^v
    }
    Sleep, 100

    ; ④ 주요쟁점사안 (아랫쪽 드롭다운) - "기타" 선택
    if (!SelectDropdownBelowText(wb, "주요쟁점사항", "기타")) {
        MsgBox, 48, 오류, "주요쟁점사항" 텍스트 아랫쪽의 드롭다운에서 "기타"를 선택할 수 없습니다.
        return
    }
    Sleep, 100

    ; ⑤ 주요쟁점사안 (아랫쪽 인풋) - 세부내용 값 입력
    if (g_phraseForDamageSurveyContent != "" && FocusInputBelowText(wb, "주요쟁점사항")) {
        Sleep, 100
        Clipboard := g_phraseForDamageSurveyContent
        Sleep, 100
        SendInput, ^a
        Sleep, 100
        SendInput, ^v
        Sleep, 100
    }

    ; ⑥ 전체추가 버튼 클릭
    if (!ClickButtonByText(wb, "전체추가")) {
        MsgBox, 48, 오류, "전체추가" 버튼을 찾을 수 없습니다.
        return
    }
    Sleep, 100

    ; ⑦ 확인창 "예" 버튼 클릭
    if (!ClickButtonByText(wb, "예")) {
        MsgBox, 48, 오류, "예" 버튼을 찾을 수 없습니다.
        return
    }
    Sleep, 100

    ; ⑧ LMS 왼쪽 가장 가까운 체크박스 클릭
    if (!ClickCheckboxLeftOfText(wb, "LMS")) {
        MsgBox, 48, 오류, "LMS" 왼쪽의 체크박스를 찾을 수 없습니다.
        return
    }
    Sleep, 100

    ; ⑨ 저장 버튼 클릭 (확정 버튼 왼쪽 = 모달 내 저장만)
    if (!ClickButtonByTextLeftOfRef(wb, "저장", "확정")) {
        MsgBox, 48, 오류, 저장 버튼을 찾을 수 없습니다.
        return
    }
    Sleep, 100

    ; ⑩ 확정 버튼 클릭 (저장 확인 다이얼로그)
    if (!ClickButtonByText(wb, "확정")) {
        ; 확정 버튼이 없으면 Enter로 대체
        SendInput, {Enter}
    }
    Sleep, 100

    ; ⑪ 닫기 버튼 클릭
    if (!ClickButtonByText(wb, "닫기")) {
        ; 닫기 버튼이 없으면 Esc 시도
        SendInput, {Esc}
    }
    Sleep, 100

    ToolTip, 손해사정서 자동기입 완료
    SetTimer, RemoveToolTip, 1500
return

; ini에서 단축키 로드
LoadHotkeysFromIni() {
    global g_hotkey1, g_hotkey2, g_hotkey3, g_iniPath
    IniRead, k1, %g_iniPath%, Hotkeys, Key1, F2
    IniRead, k2, %g_iniPath%, Hotkeys, Key2, F3
    IniRead, k3, %g_iniPath%, Hotkeys, Key3, F4
    if (k1 != "ERROR" && k1 != "")
        g_hotkey1 := k1
    if (k2 != "ERROR" && k2 != "")
        g_hotkey2 := k2
    if (k3 != "ERROR" && k3 != "")
        g_hotkey3 := k3
}

; ini에서 연락처 로드
LoadContactFromIni() {
    global g_contactValue, g_iniPath
    IniRead, val, %g_iniPath%, DamageSurvey, Contact,
    if (val != "ERROR" && val != "")
        g_contactValue := val
}

; ini에서 새창열기 설정 로드
LoadNewWindowFromIni() {
    global g_targetURL, g_waitTimeNewWindow, g_iniPath
    defaultUrl := "https://nexusui.samsungfire.com/nexusUi/page/NPGEFCC21000.do?IV_CCEVENT=***"
    IniRead, url, %g_iniPath%, NewWindow, TargetURL, %defaultUrl%
    IniRead, wt, %g_iniPath%, NewWindow, WaitTime, 800
    if (url != "ERROR" && url != "")
        g_targetURL := url
    if (wt != "ERROR" && wt != "")
        g_waitTimeNewWindow := wt
}

; ini에서 IE 캐시 자동제거 설정 로드
LoadCacheCleanerFromIni() {
    global g_cacheCleanerEnabled, g_cacheLastCleanTime, g_iniPath
    IniRead, en, %g_iniPath%, CacheCleaner, Enabled, 1
    IniRead, last, %g_iniPath%, CacheCleaner, LastCleanTime, 00000000000000
    if (en = "0")
        g_cacheCleanerEnabled := false
    if (last != "ERROR" && last != "")
        g_cacheLastCleanTime := last
}

; 단축키 등록 (초기 실행 시)
RegisterHotkeys() {
    global g_hotkey1, g_hotkey2, g_hotkey3, g_newWindowEnabled
    Hotkey, %g_hotkey1%, BtnRunAll, On
    Hotkey, %g_hotkey2%, BtnF7Combo, On
    Hotkey, F5, HotkeyPhraseInsert, On
    Hotkey, %g_hotkey3%, BtnDamageSurvey, On
    Hotkey, F6, ToggleNewWindowMacro, On
    if (g_newWindowEnabled)
        Hotkey, ^LButton, NewWindowOnCtrlClick, On
}

; 마지막 포커스 창 저장 (문장 삽입 타겟용)
StoreLastWindow:
    global g_lastExternalHwnd
    hwnd := WinActive("A")
    if (!hwnd)
        return
    try {
        WinGet, procName, ProcessName, ahk_id %hwnd%
        if (procName = "AutoHotkey.exe" || procName = "AutoHotkeyU64.exe" || procName = "AutoHotkeyU32.exe")
            return
    }
    g_lastExternalHwnd := hwnd
return

; =========================
; 문장 삽입 (테스트) - 포커스된 인풋에 문장 삽입
; F5: 현재 포커스 창에 삽입 | 버튼: 마지막 포커스 창에 삽입
; =========================
HotkeyPhraseInsert:
    global g_phraseTargetHwnd
    g_phraseTargetHwnd := WinExist("A")
    Gosub, ShowPhraseInsertGUI
return

ShowPhraseInsertGUI:
    global g_phraseTargetHwnd, g_lastExternalHwnd
    if (!g_phraseTargetHwnd)
        g_phraseTargetHwnd := g_lastExternalHwnd
    if (!g_phraseTargetHwnd) {
        MsgBox, 48, 안내, 입력할 창을 먼저 클릭한 뒤 F5를 누르세요.
        return
    }
    ShowPhraseInsertGUINow()
return

; 27개 문장 목록 (버튼별) - TITLE: 관계 법규 및 약관, CONTENT: 세부내용
; btn: 버튼 표시용(길면 생략), title/content: 실제 입력값
GetPhraseList() {
    list := []

    list.Push({btn:"1.공제금 미만", title:"공제금 미만", content:"(1) 신계약 -30만원 한도 회사는 통원 1일당 국민건강보험법에 의하여 피보험자가 부담하는 제1항, 제2항의 비용전액(국민건강보험법에서 정한 요양급여 중 본인부담분과 비급여부분을 말합니다)에 대하여 1만원을 공제한 금액의 100% 해당액을 최고 30만원을 한도로 보상하여 드립니다. 다만 피보험자가 국민건강보험을 적용받지 못한 경우에는 통원 1일당 발생 통원의료비 총액에서 1만원을 공제한 금액의 40% 해당액을 최고 30만원 한도로 보상합니다."})

    list.Push({btn:"2.면책기간", title:"면책기간", content:"동일질병 또는 하나의 사고로 인한 통원의료비 보상한도는 사고일 또는 발병일부터 365일 이전 기간 동안 발생한 통산 통원일수 30일을 한도로 합니다. 동일질병이라도 최종 통원일부터 180일 경과 후 개시한 통원은 새로운 발병으로 간주하여 보상합니다. 입원의 경우 최초 입원일부터 365일까지 보상하며 이후 90일 보상제외기간이 적용됩니다."})

    list.Push({btn:"3.본인부담상한제", title:"본인부담상한제", content:"급여 본인부담금 상한제란 병의원 및 약국에서 진료 후 본인이 부담한 건강보험 급여 총액이 연간 개인별 상한액을 초과할 경우 초과금액을 국민건강보험공단에서 환급하는 제도입니다. 회사는 공단 등으로부터 사전 또는 사후 환급 가능한 금액에 대해서는 보상하지 않으며 관련 법령 기준에 따라 처리됩니다."})

    list.Push({btn:"4.부담보", title:"부담보", content:"특별면책조건 기간 중 특정신체부위 또는 특정질병을 직접 원인으로 보험금 지급사유가 발생한 경우 보험금을 지급하지 않습니다. 면책기간은 1년에서 5년 또는 보험기간 전체로 적용될 수 있으며 계약 인수기준 및 의사 소견에 따라 달라질 수 있습니다. 다만 사망 또는 80% 이상 장해 발생 시에는 예외 적용될 수 있습니다."})

    list.Push({btn:"5.신경성형술 기타", title:"신경성형술 기타(화상, 요실금, 진단비, 피부질환, 보조기)~", content:"보험약관상 입원은 6시간 이상 입원실 체류 및 의료진의 지속적 관찰과 관리 하에 치료를 받은 경우에 해당하며 치료의 실질이 입원치료에 해당하여야 합니다. 단순 시술 또는 단기 체류 치료는 입원으로 인정되지 않을 수 있으며 관련 판례 기준에 따라 판단됩니다."})

    list.Push({btn:"6.체외충격파~", title:"체외충격파~", content:"체외충격파 쇄석술 등은 약관상 수술의 정의에 해당하지 않는 시술에 포함됩니다. 수술 정의에 해당하지 않는 시술은 예시에 기재되지 않았더라도 동일 기준이 적용되며 수술비 보상 대상에서 제외됩니다. 따라서 해당 시술은 통상적 시술로 분류되어 별도 보상되지 않습니다."})

    list.Push({btn:"7.예방접종+", title:"예방접종+", content:"질병을 원인으로 하지 않는 예방접종, 인공유산, 불임시술, 제왕절개수술 등은 보상하지 않습니다. 또한 피로, 권태, 심신허약 치료 목적 안정치료, 위생관리 및 미용 목적 시술, 정상분만 등도 보상 대상에서 제외됩니다."})

    list.Push({btn:"8.지연이자~", title:"지연이자~", content:"보험금 지급기일 내 지급되지 않을 경우 다음날부터 지급일까지 약관에서 정한 이율로 계산한 지연이자를 보험금에 가산하여 지급합니다. 지급지연 기준은 보험금 지급절차 조항에 따라 적용됩니다."})

    list.Push({btn:"9.정신질환+", title:"정신질환+", content:"한국표준질병사인분류상 정신과질환 및 행동장애(F04~F99)에 대한 통원의료비는 보상하지 않습니다. 다만 일부 질환군 치료 중 건강보험 요양급여에 해당하는 의료비는 예외적으로 보상 가능합니다."})

    list.Push({btn:"10.영양제+", title:"영양제+", content:"영양제 투약비용은 식약처 허가사항 및 치료목적 소견이 확인되는 경우에 한해 제한적으로 보상 가능합니다. 단순 영양공급, 피로회복 목적 투약, 임상적 소견과 무관한 고단위 영양제 투여비용은 보상하지 않습니다."})

    list.Push({btn:"11.임신출산+", title:"임신출산+", content:"임신, 출산, 제왕절개, 산후기 관련 입원 및 치료비는 보상하지 않습니다. 또한 습관성 유산, 불임, 인공수정 합병증 등 여성생식기 비염증성 장애 관련 치료도 보상 대상에서 제외됩니다."})

    list.Push({btn:"12.치과질환 면책+", title:"치과질환 면책+", content:"치과질환으로 인한 통원의료비는 보상하지 않습니다. 다만 상해로 인한 치과진료의 경우 의치비용을 제외한 치료비는 보상 가능합니다. 비급여 치과치료 및 한방치료 의료비는 보상 대상에서 제외됩니다."})

    list.Push({btn:"13.한방면책+", title:"한방면책+", content:"한방병원 및 한의원 치료는 약관상 보상 대상에서 제외됩니다. 단, 의사의 의료행위에 해당하는 치료로 발생한 의료비는 보상 가능 여부를 별도 심사 후 판단합니다."})

    list.Push({btn:"14.항문질환 면책+", title:"항문질환 면책+", content:"치핵 및 직장 또는 항문 관련 질환(K60~K62, K64 등) 치료 및 수술비는 보상하지 않습니다. 해당 질환으로 인한 입원 및 통원 수술비 모두 보상 제외 대상입니다."})

    list.Push({btn:"15.사마귀 면책+", title:"사마귀 면책+", content:"주근깨, 점, 사마귀, 여드름, 탈모 등 피부질환 치료비는 보상하지 않습니다. 미용 목적 치료 및 노화현상 관련 피부질환 역시 보상 대상에서 제외됩니다."})

    list.Push({btn:"16.실효+", title:"실효+", content:"보험료 납입이 연체될 경우 회사는 14일 이상의 납입최고기간을 부여하며 기간 내 미납 시 계약은 해지됩니다. 해지 시 해약환급금에서 대출원리금이 차감될 수 있습니다."})

    list.Push({btn:"17.수술비~", title:"수술비~", content:"질병 치료 목적 입원 후 시행된 수술에 대해 약관 기준에 따라 수술비가 지급됩니다. 동일 질병으로 2회 이상 통원수술 시 1회만 지급되며 365일 경과 후 시행 시 별도 인정됩니다."})

    list.Push({btn:"18.대장용종~", title:"대장용종~", content:"대장용종 및 양성신생물 내시경 절제술은 수술비 보상 대상에서 제외됩니다. 질병 입원 및 통원 수술비 모두 지급되지 않습니다."})

    list.Push({btn:"19.신경차단술+", title:"신경차단술+", content:"신경차단술, 천자, 흡인 등 주사 및 시술 행위는 수술의 정의에 해당하지 않으며 수술비 보상 대상에서 제외됩니다."})

    list.Push({btn:"20.제증명료+", title:"제증명료+", content:"진료와 무관한 제증명료, TV시청료, 전화료, 간병비 등 비급여 비용은 보상하지 않습니다."})

    list.Push({btn:"21.응급실", title:"응급실", content:"응급환자로 분류되어 응급실 내원 진료 시 약관 기준에 따라 연간 12회 한도로 응급실 내원진료비가 지급됩니다. 비응급환자 내원은 별도 기준이 적용됩니다."})

    list.Push({btn:"22.보상기간한도초과", title:"보상기간 및 한도초과", content:"동일질병 통원의료비는 발병일부터 365일 이내 통산 30일 한도로 보상합니다. 이후 180일 경과 후 재통원 시 신규 발병으로 간주합니다."})

    list.Push({btn:"23.깁스", title:"깁스", content:"상해 또는 질병으로 깁스치료 시행 시 약관 기준에 따라 사고당 1회 한도로 깁스치료비를 지급합니다."})

    list.Push({btn:"24.유병력자", title:"유병력자", content:"유병력자 실손은 통원 공제금액 및 보상비율이 별도 적용되며 비급여 도수치료, 주사료, MRI 등은 보상하지 않습니다."})

    list.Push({btn:"25.검진 면책", title:"검진 면책", content:"건강검진, 예방접종, 인공유산 등은 보상하지 않습니다. 단 질병 치료 목적 검진은 예외 적용될 수 있습니다."})

    list.Push({btn:"26.보상안하는사항 안내", title:"보상하지 않는사항 안내", content:"정신질환, 임신출산, 선천질환, 비만, 치과질환, 미용수술 등은 약관상 보상하지 않습니다."})

    list.Push({btn:"27.기타", title:"기타", content:"심재성 2도 이상 화상은 약관 기준에 따라 진단비 지급 대상이 될 수 있으나 요실금 및 일부 피부질환 치료는 보상하지 않습니다."})

    return list
}


ShowPhraseInsertGUINow() {
    global g_phraseDamageSurveyMode
    phrases := GetPhraseList()
    Gui, Phrase:Destroy
    title := g_phraseDamageSurveyMode ? "관계 법규 및 약관 문장 선택" : "문장 삽입"
    msg := g_phraseDamageSurveyMode ? "관계 법규(TITLE) / 세부내용(CONTENT)에 넣을 문장을 선택하세요." : "포커스한 입력창에 문장을 삽입합니다."
    Gui, Phrase:New, +AlwaysOnTop +OwnerMain, %title%
    Gui, Phrase:Font, s9, 맑은 고딕
    Gui, Phrase:Margin, 12, 8
    Gui, Phrase:Add, Text, xm ym w560 h20, %msg%
    btnW := 105
    btnH := 24
    gap := 5
    startY := 32
    ; 5열 x 6행 그리드 (27개 버튼)
    Loop, 27 {
        col := Mod(A_Index - 1, 5)
        row := (A_Index - 1) // 5
        xPos := 12 + col * (btnW + gap)
        yPos := startY + row * (btnH + gap)
        gLabel := "PhraseBtn" . A_Index
        btnText := phrases[A_Index].btn
        Gui, Phrase:Add, Button, x%xPos% y%yPos% w%btnW% h%btnH% g%gLabel%, %btnText%
    }
    closeY := startY + 6 * (btnH + gap)
    Gui, Phrase:Add, Button, xm y%closeY% w80 h26 gPhraseClose, 닫기
    Gui, Phrase:Show, w575 h255
}

PhraseClose:
    Gui, Phrase:Destroy
return

PhraseBtn1:
    RunPhraseInsert(1)
return
PhraseBtn2:
    RunPhraseInsert(2)
return
PhraseBtn3:
    RunPhraseInsert(3)
return
PhraseBtn4:
    RunPhraseInsert(4)
return
PhraseBtn5:
    RunPhraseInsert(5)
return
PhraseBtn6:
    RunPhraseInsert(6)
return
PhraseBtn7:
    RunPhraseInsert(7)
return
PhraseBtn8:
    RunPhraseInsert(8)
return
PhraseBtn9:
    RunPhraseInsert(9)
return
PhraseBtn10:
    RunPhraseInsert(10)
return
PhraseBtn11:
    RunPhraseInsert(11)
return
PhraseBtn12:
    RunPhraseInsert(12)
return
PhraseBtn13:
    RunPhraseInsert(13)
return
PhraseBtn14:
    RunPhraseInsert(14)
return
PhraseBtn15:
    RunPhraseInsert(15)
return
PhraseBtn16:
    RunPhraseInsert(16)
return
PhraseBtn17:
    RunPhraseInsert(17)
return
PhraseBtn18:
    RunPhraseInsert(18)
return
PhraseBtn19:
    RunPhraseInsert(19)
return
PhraseBtn20:
    RunPhraseInsert(20)
return
PhraseBtn21:
    RunPhraseInsert(21)
return
PhraseBtn22:
    RunPhraseInsert(22)
return
PhraseBtn23:
    RunPhraseInsert(23)
return
PhraseBtn24:
    RunPhraseInsert(24)
return
PhraseBtn25:
    RunPhraseInsert(25)
return
PhraseBtn26:
    RunPhraseInsert(26)
return
PhraseBtn27:
    RunPhraseInsert(27)
return

RunPhraseInsert(btnNum) {
    global g_phraseTargetHwnd, g_phraseDamageSurveyMode, g_phraseForDamageSurveyTitle, g_phraseForDamageSurveyContent
    phrases := GetPhraseList()
    item := phrases[btnNum]
    titleVal := item.title
    contentVal := item.content
    Gui, Phrase:Destroy
    if (g_phraseDamageSurveyMode) {
        g_phraseForDamageSurveyTitle := titleVal
        g_phraseForDamageSurveyContent := contentVal
        return
    }
    if (g_phraseTargetHwnd) {
        WinActivate, ahk_id %g_phraseTargetHwnd%
        Sleep, 80
        SendRaw, %contentVal%
    }
}

; =========================
; 전체 행 자동 입력 (DOM 기반, 좌표 미사용)
; =========================
BtnRunAll:
    ; GUI 입력값 반영 (MAX_ROWS)
    Gui, Main:Submit, NoHide
    if (MaxRowsEdit != "") {
        if RegExMatch(MaxRowsEdit, "^\d+$") {
            if (MaxRowsEdit < 1) {
                MsgBox, 48, 오류, MAX_ROWS는 1 이상이어야 합니다.
                return
            }
            MAX_ROWS := MaxRowsEdit
        } else {
            MsgBox, 48, 오류, MAX_ROWS는 숫자만 입력해주세요.
            return
        }
    }

    wb := GetActiveIEWindow()
    if (!wb) {
        MsgBox, 48, 오류, 포커스된 웹브라우저를 찾을수 없습니다.
        return
    }

    rows := ReadExcelData("")
    if (!IsObject(rows) || rows.Length()=0) {
        MsgBox, 48, 오류, 엑셀 데이터를 읽을 수 없습니다.`n엑셀 파일을 열어두셨는지 확인하세요.
        return
    }

    startIndex := 1
    total := rows.Length()
    if (total < startIndex) {
        MsgBox, 48, 오류, 처리할 데이터 행이 없습니다.
        return
    }

    MsgBox, 64, 시작, % "자동 입력을 시작합니다.`n총 " (total - startIndex + 1) "행 처리 예정입니다.`n`n중지: ESC"
    Hotkey, Esc, StopRun, On
    global g_stopFlag := false

    Loop, %total% {
        if (g_stopFlag)
            break

        i := A_Index
        if (i < startIndex)
            continue

        row := rows[i]
        a := Trim(row["A"])
        b := Trim(row["B"])
        c := Trim(row["C"])
        if (a = "" || a = "_")
            break

        ToolTip, % "자동 입력 중... (" i "/" total ")`nA=" a "`nB=" b "`nC=" c

        ok := ProcessOneRow(wb, a, b, c, i)
        if (!ok) {
            ToolTip
            Hotkey, Esc, Off
            return
        }
    }

    ToolTip
    Hotkey, Esc, Off
    MsgBox, 64, 완료, 자동 입력이 종료되었습니다.
return

StopRun:
    global g_stopFlag
    g_stopFlag := true
return

; =========================
; F3: 결제의견 기입 - 새창 열기(IV_CLAIM) → 행추가 → SE입력 Enter → NUI-find 왼쪽 입력(최신클립보드) → 저장 Enter
; 클립보드 1번(최신)=NUI-find 입력, 2번(직전)=IV_CLAIM(숫자만)
; =========================
BtnF7Combo:
    global TEST_URL_BASE, BTN_ADDROW_NAME, BTN_ADDROW_ID, BTN_SAVE_NAME, BTN_SAVE_ID
    global g_currClipboard, g_prevClipboard, WAIT_LOADING_MS
    wb := GetActiveIEWindow()
    if (!wb) {
        MsgBox, 48, 오류, Edge IE 모드 창을 찾을 수 없습니다.
        return
    }
    ; IV_CLAIM: 직전 클립보드에서 숫자만 추출 (없으면 최신 클립보드 사용)
    srcForClaim := (g_prevClipboard != "") ? g_prevClipboard : g_currClipboard
    claimNum := RegExReplace(srcForClaim, "\D", "")
    if (claimNum = "") {
        MsgBox, 48, 오류, IV_CLAIM용 값이 없습니다.`n`n클립보드에 클레임번호(숫자 포함)를 복사한 뒤 F3을 실행하세요.
        return
    }
    f7Url := TEST_URL_BASE . "?IV_CLAIM=" . claimNum . "&IV_TYPE=2&IS_POPUP=true&POPUP_SIZE=custom"
    nuiFindValue := g_currClipboard   ; URL 붙여넣기 전에 NUI-find 값 보관 (붙여넣기 후 ClipSnapshot이 g_currClipboard 덮음)
    ; ① 새창 열기 (Ctrl+N → 주소창에 URL 붙여넣기)
    Clipboard := f7Url
    Sleep, 100
    SendInput, ^n
    Sleep, 100
    SendInput, ^l
    Sleep, 100
    SendInput, ^v
    Sleep, 150
    SendInput, {Enter}
    Sleep, 100
    ; URL 붙여넣기로 ClipSnapshot이 g_currClipboard를 덮었으므로, NUI-find는 g_prevClipboard에 있음
    Clipboard := (g_prevClipboard != "") ? g_prevClipboard : g_currClipboard
    Sleep, 100
    wb := GetActiveIEWindow()
    if (!wb) {
        MsgBox, 48, 오류, 새 창을 찾을 수 없습니다.
        return
    }
    ; 새 창 로딩 완료 대기
    if (!WaitForLoadingComplete(wb, WAIT_LOADING_MS)) {
        MsgBox, 48, 타임아웃, 새 창 로딩이 완료되지 않았습니다.
        return
    }
    Sleep, 100
    ; ② 행추가
    if (!ClickButtonByNameOrId(wb, BTN_ADDROW_NAME, BTN_ADDROW_ID, BTN_ADDROW_NAME)) {
        MsgBox, 48, 오류, 행추가 버튼을 찾을 수 없습니다.
        return
    }
    Sleep, 100
    ; ③ 처리일자 포커스 후 Tab 2번 → 사고처리과정명
    if (!ClickLeftOfCalendarButton(wb)) {
        MsgBox, 48, 오류, 처리일자 입력칸을 찾을 수 없습니다.
        return
    }
    Sleep, 100
    SendInput, {Tab}
    Sleep, 150
    SendInput, {Tab}
    Sleep, 100
    ; ④ 사고처리과정명 SE 입력, Enter
    SendInput, ^a
    Sleep, 150
    SendRaw, SE
    Sleep, 100
    SendInput, {Enter}
    Sleep, 100
    ; ⑤ NUI-find 버튼 왼쪽 입력창 포커스, 저장해둔 NUI-find 값 붙여넣기
    if (!ClickLeftOfFindButton(wb)) {
        MsgBox, 48, 오류, NUI-find 버튼 또는 왼쪽 입력창을 찾을 수 없습니다.
        return
    }
    Sleep, 150
    Clipboard := nuiFindValue
    Sleep, 100
    SendInput, ^v
    Sleep, 100
    ; ⑥ 저장 버튼 클릭, Enter 2회 (확인창 처리)
    if (!ClickButtonByNameOrId(wb, BTN_SAVE_NAME, BTN_SAVE_ID, BTN_SAVE_NAME)) {
        MsgBox, 48, 오류, 저장 버튼을 찾을 수 없습니다.
        return
    }
    Sleep, 100
    SendInput, {Enter}
    Sleep, 100
    SendInput, {Enter}
return

; =========================
; 행 처리 (DOM 기반, 실패 시 에러 반환)
; =========================
ProcessOneRow(wb, a, b, c, rowIdx := "") {
    global WAIT_LOADING_MS
    global BTN_ADDROW_NAME, BTN_ADDROW_ID, BTN_SAVE_NAME, BTN_SAVE_ID

    rowInfo := (rowIdx != "") ? " (" rowIdx "행)" : ""

    ; ① 클레임번호 (IMAGE 버튼 왼쪽 입력창)
    if (!ClickLeftOfButtonByText(wb, BTN_IMAGE_TEXT)) {
        MsgBox, 48, 요소 없음, IMAGE 버튼을 찾을 수 없습니다.`n클레임번호 입력칸을 찾을 수 없습니다.%rowInfo%
        return false
    }
    Sleep, 100
    SendInput, ^a
    Sleep, 100
    
    ; 클립보드로 붙여넣기 (더 안정적)
    Clipboard := a
    Sleep, 100
    SendInput, ^v
    Sleep, 100

    ; Enter + 로딩대기
    if (!SendEnterAndWait(wb, WAIT_LOADING_MS)) {
        if (rowIdx != "") {
            done := rowIdx - 1
            MsgBox, 48, 타임아웃, % rowIdx "행에서 클레임번호 입력 후 로딩이 완료되지 않았습니다.`n`n" done "행까지 작업 완료했습니다."
        } else {
            MsgBox, 48, 타임아웃, 클레임번호 입력 후 로딩이 완료되지 않았습니다.
        }
        return false
    }

    ; ② 행추가 버튼 클릭
    if (!ClickButtonByNameOrId(wb, BTN_ADDROW_NAME, BTN_ADDROW_ID, BTN_ADDROW_NAME)) {
        MsgBox, 48, 요소 없음, 행추가 버튼을 찾을 수 없습니다.%rowInfo%
        return false
    }
    Sleep, 100



    
    ; ③ 처리일자 입력
    if (!ClickLeftOfCalendarButton(wb)) {
        MsgBox, 48, 요소 없음, 처리일자 입력칸을 찾을 수 없습니다.%rowInfo%
        return false
    }
    Sleep, 100
    SendInput, ^a
    Sleep, 100
    Clipboard := b
    Sleep, 100
    SendInput, ^v
    Sleep, 100

    ; Tab 2번으로 사고처리과정명으로 이동
    SendInput, {Tab}
    Sleep, 150
    SendInput, {Tab}
    Sleep, 100

    ; ④ 사고처리과정명 입력 (클립보드)
    SendInput, ^a
    Sleep, 150
    Clipboard := c
    Sleep, 100
    SendInput, ^v
    Sleep, 100
    SendInput, {Enter}
    Sleep, 100

    ; ⑤ 저장 버튼 클릭
    if (!ClickButtonByNameOrId(wb, BTN_SAVE_NAME, BTN_SAVE_ID, BTN_SAVE_NAME)) {
        MsgBox, 48, 요소 없음, 저장 버튼을 찾을 수 없습니다.%rowInfo%
        return false
    }
    Sleep, 100
    
    ; 1회 Enter = 예(저장하시겠습니까?) → 저장 로딩바 → 저장되었습니다 알림
    SendInput, {Enter}
    Sleep, 100
    if (!WaitForLoadingComplete(wb, WAIT_LOADING_MS)) {
        if (rowIdx != "")
            MsgBox, 48, 타임아웃, % rowIdx "행에서 저장 확인 후 로딩이 완료되지 않았습니다."
        else
            MsgBox, 48, 타임아웃, 저장 확인 후 로딩이 완료되지 않았습니다.
        return false
    }
    ; 2회 Enter = 저장되었습니다 알림 닫기 → 리스트 갱신 로딩
    SendInput, {Enter}
    Sleep, 100

    ; 리스트 갱신 로딩 대기
    if (!WaitForLoadingComplete(wb, WAIT_LOADING_MS)) {
        if (rowIdx != "") {
            done := rowIdx - 1
            MsgBox, 48, 타임아웃, % rowIdx "행에서 저장 후 로딩이 완료되지 않았습니다.`n`n" done "행까지 작업 완료했습니다."
        } else {
            MsgBox, 48, 타임아웃, 저장 후 로딩이 완료되지 않았습니다.
        }
        return false
    }
    
    return true
}

SendEnterAndWait(wb, waitMs := 10000) {
    SendInput, {Enter}
    Sleep, 100
    return WaitForLoadingComplete(wb, waitMs)
}

; =========================
; ✅ 버튼을 name/id로 클릭 (좌표 없이)
; - 1순위: getElementsByName(name)[0].click()
; - 2순위: getElementById(id).click()
; - 3순위(옵션): innerText로 버튼 찾기 (느리지만 마지막 보험)
; =========================
ClickButtonByNameOrId(wb, btnName := "", btnId := "", btnText := "") {
    doc := wb.document
    if (!IsObject(doc))
        return false

    ; 1) name
    if (btnName != "") {
        try {
            els := doc.getElementsByName(btnName)
            if (els.length > 0) {
                el := els[0]
                try el.scrollIntoView(true)
                Sleep, 100
                el.click()
                return true
            }
        } catch {
        }
    }

    ; 2) id
    if (btnId != "") {
        try {
            el := doc.getElementById(btnId)
            if (IsObject(el)) {
                try el.scrollIntoView(true)
                Sleep, 100
                el.click()
                return true
            }
        } catch {
        }
    }

    ; 3) text (button, span, a)
    if (btnText != "") {
        try {
            btns := doc.getElementsByTagName("button")
            Loop % btns.length {
                el := btns[A_Index-1]
                t := ""
                try t := Trim(el.innerText)
                if (t != "" && (t = btnText || InStr(t, btnText)) && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    try el.scrollIntoView(true)
                    Sleep, 100
                    el.click()
                    return true
                }
            }
        } catch {
        }
        try {
            spans := doc.getElementsByTagName("span")
            Loop % spans.length {
                el := spans[A_Index-1]
                t := ""
                try t := Trim(el.innerText)
                if (t != "" && (t = btnText || InStr(t, btnText)) && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    try el.scrollIntoView(true)
                    Sleep, 100
                    el.click()
                    return true
                }
            }
        } catch {
        }
        try {
            links := doc.getElementsByTagName("a")
            Loop % links.length {
                el := links[A_Index-1]
                t := ""
                try t := Trim(el.innerText)
                if (t != "" && (t = btnText || InStr(t, btnText)) && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    try el.scrollIntoView(true)
                    Sleep, 100
                    el.click()
                    return true
                }
            }
        } catch {
        }
    }

    return false
}

; =========================
; 텍스트로 버튼/요소 클릭 (button, span, a)
; =========================
ClickButtonByText(wb, btnText) {
    return ClickButtonByNameOrId(wb, "", "", btnText)
}

; =========================
; ✅ "확정" 등 기준(refText) 버튼 왼쪽에 있는 "저장"(btnText) 버튼만 클릭 (모달 내 저장만 선택)
; =========================
ClickButtonByTextLeftOfRef(wb, btnText, refText) {
    doc := wb.document
    if (!IsObject(doc))
        return false
    try {
        btnTrimmed := Trim(btnText)
        refTrimmed := Trim(refText)
        ; 1) refText("확정") 요소들의 왼쪽 X 수집 (가장 왼쪽 확정 기준)
        refLeftX := ""
        for tag, tagName in {button: "button", span: "span", a: "a"} {
            els := doc.getElementsByTagName(tagName)
            Loop % els.length {
                el := els[A_Index - 1]
                try {
                    t := Trim(el.innerText)
                    if (t = refTrimmed && el.offsetWidth > 0 && el.offsetHeight > 0) {
                        r := el.getBoundingClientRect()
                        if (refLeftX = "" || r.left < refLeftX)
                            refLeftX := r.left
                    }
                } catch {
                }
            }
        }
        if (refLeftX = "")
            return false
        ; 2) btnText("저장") 중 refLeftX 왼쪽에 있는 것만 (저장.right < 확정.left)
        bestSave := ""
        bestRight := -99999
        for tag, tagName in {button: "button", span: "span", a: "a"} {
            els := doc.getElementsByTagName(tagName)
            Loop % els.length {
                el := els[A_Index - 1]
                try {
                    t := Trim(el.innerText)
                    if (t = btnTrimmed && el.offsetWidth > 0 && el.offsetHeight > 0) {
                        r := el.getBoundingClientRect()
                        if (r.right < refLeftX && r.right > bestRight) {
                            bestRight := r.right
                            bestSave := el
                        }
                    }
                } catch {
                }
            }
        }
        if (!bestSave)
            return false
        try bestSave.scrollIntoView(true)
        Sleep, 100
        bestSave.click()
        return true
    } catch {
        return false
    }
}

; =========================
; 통합_매크로_빌더와 동일한 체크박스 검색 로직
; (요소 가시성, X오프셋, TR/부모 탐색, label-for 등 다단계 Fallback)
; =========================

; 요소 가시성 확인
IsElementVisible(element) {
    try {
        if (element.offsetWidth = 0 || element.offsetHeight = 0)
            return false
        try {
            if (element.currentStyle.display = "none")
                return false
            if (element.currentStyle.visibility = "hidden")
                return false
        }
        return true
    } catch {
        return false
    }
}

; X 방향 오프셋 계산 (음수=왼쪽, 양수=오른쪽)
CalculateXOffset(wb, elem1, elem2) {
    try {
        rect1 := elem1.getBoundingClientRect()
        rect2 := elem2.getBoundingClientRect()
        x1 := rect1.left + (rect1.width / 2)
        x2 := rect2.left + (rect2.width / 2)
        return Round(x2 - x1)
    } catch {
        return 0
    }
}

; 텍스트 옆의 체크박스 클릭 (통합_매크로_빌더 ClickCheckboxByLabel과 동일)
ClickCheckboxByLabel(wb, labelText) {
    try {
        labelTextTrimmed := Trim(labelText)
        labelNoSpace := StrReplace(labelTextTrimmed, " ", "")
        labelNoSpace := StrReplace(labelNoSpace, A_Tab, "")

        exactMatches := []
        noSpaceMatches := []
        partialMatches := []

        allElements := wb.document.getElementsByTagName("*")
        Loop % allElements.length {
            el := allElements[A_Index-1]
            try {
                tagName := el.tagName
                if (tagName != "TD" && tagName != "TH" && tagName != "SPAN" && tagName != "DIV" && tagName != "LABEL" && tagName != "P" && tagName != "FONT" && tagName != "B" && tagName != "STRONG" && tagName != "A")
                    continue
                elText := Trim(el.innerText)
                elTextLen := StrLen(elText)
                elNoSpace := StrReplace(elText, " ", "")
                elNoSpace := StrReplace(elNoSpace, A_Tab, "")
                try {
                    rect := el.getBoundingClientRect()
                    elY := rect.top
                } catch {
                    elY := 0
                }
                candidate := {el: el, textLen: elTextLen, y: elY}
                if (elText = labelTextTrimmed) {
                    exactMatches.Push(candidate)
                } else if (elNoSpace = labelNoSpace) {
                    noSpaceMatches.Push(candidate)
                } else if (InStr(elText, labelTextTrimmed) && elTextLen < 50) {
                    partialMatches.Push(candidate)
                }
            } catch {
            }
        }

        bestCheckbox := ""
        bestXOffset := 99999
        searchMethod := ""
        matchedElement := ""
        matchedElementY := 0
        matchedTextLen := 0

        priorityLists := [exactMatches, noSpaceMatches, partialMatches]
        priorityNames := ["정확일치", "공백제거일치", "부분포함"]

        Loop, 3 {
            currentList := priorityLists[A_Index]
            currentName := priorityNames[A_Index]
            if (currentList.Length() = 0)
                continue

            for idx, candidate in currentList {
                el := candidate.el
                elY := candidate.y
                foundCb := ""
                foundOffset := 99999
                foundYDiff := 99999
                foundMethod := ""

                if (elY > 0) {
                    parent := el
                    Loop, 10 {
                        if (!parent)
                            break
                        checkboxes := parent.getElementsByTagName("input")
                        Loop % checkboxes.length {
                            cb := checkboxes[A_Index-1]
                            try {
                                if (cb.type = "checkbox" && IsElementVisible(cb)) {
                                    cbRect := cb.getBoundingClientRect()
                                    cbY := cbRect.top
                                    yDiff := Abs(cbY - elY)
                                    if (yDiff <= 20) {
                                        xOffset := CalculateXOffset(wb, el, cb)
                                        isBetter := false
                                        if (!foundCb)
                                            isBetter := true
                                        else if (yDiff < foundYDiff)
                                            isBetter := true
                                        else if (yDiff = foundYDiff && xOffset < 0 && Abs(xOffset) < Abs(foundOffset))
                                            isBetter := true
                                        if (isBetter) {
                                            foundCb := cb
                                            foundOffset := xOffset
                                            foundYDiff := yDiff
                                            foundMethod := currentName . "+Y일치"
                                        }
                                    }
                                }
                            } catch {
                            }
                        }
                        if (parent.tagName = "TR" || parent.tagName = "TABLE")
                            break
                        parent := parent.parentElement
                    }
                }

                if (!foundCb) {
                    try {
                        parent := el
                        Loop, 10 {
                            if (!parent)
                                break
                            if (parent.tagName = "TR") {
                                checkboxes := parent.getElementsByTagName("input")
                                Loop % checkboxes.length {
                                    cb := checkboxes[A_Index-1]
                                    if (cb.type = "checkbox" && IsElementVisible(cb)) {
                                        xOffset := CalculateXOffset(wb, el, cb)
                                        if (xOffset < 0) {
                                            absOffset := Abs(xOffset)
                                            if (!foundCb || absOffset < Abs(foundOffset)) {
                                                foundCb := cb
                                                foundOffset := xOffset
                                                foundMethod := currentName . "+TR왼쪽"
                                            }
                                        } else if (!foundCb) {
                                            foundCb := cb
                                            foundOffset := xOffset
                                            foundMethod := currentName . "+TR오른쪽"
                                        }
                                    }
                                }
                                break
                            }
                            parent := parent.parentElement
                        }
                    } catch {
                    }
                }

                if (!foundCb && elY > 0) {
                    allInputs := wb.document.getElementsByTagName("input")
                    Loop % allInputs.length {
                        cb := allInputs[A_Index-1]
                        try {
                            if (cb.type = "checkbox" && IsElementVisible(cb)) {
                                cbRect := cb.getBoundingClientRect()
                                cbY := cbRect.top
                                yDiff := Abs(cbY - elY)
                                if (yDiff <= 15) {
                                    xOffset := CalculateXOffset(wb, el, cb)
                                    if (xOffset < 0) {
                                        absOffset := Abs(xOffset)
                                        if (!foundCb || absOffset < Abs(foundOffset)) {
                                            foundCb := cb
                                            foundOffset := xOffset
                                            foundMethod := currentName . "+Y좌표"
                                        }
                                    } else if (!foundCb) {
                                        foundCb := cb
                                        foundOffset := xOffset
                                        foundMethod := currentName . "+Y좌표"
                                    }
                                }
                            }
                        } catch {
                        }
                    }
                }

                if (!foundCb) {
                    parent := el.parentElement
                    Loop, 5 {
                        if (!parent)
                            break
                        inputs := parent.getElementsByTagName("input")
                        Loop % inputs.length {
                            cb := inputs[A_Index-1]
                            if (cb.type = "checkbox" && IsElementVisible(cb)) {
                                xOffset := CalculateXOffset(wb, el, cb)
                                if (xOffset < 0) {
                                    if (!foundCb || Abs(xOffset) < Abs(foundOffset)) {
                                        foundCb := cb
                                        foundOffset := xOffset
                                        foundMethod := currentName . "+부모요소"
                                    }
                                } else if (!foundCb) {
                                    foundCb := cb
                                    foundOffset := xOffset
                                    foundMethod := currentName . "+부모요소"
                                }
                            }
                        }
                        parent := parent.parentElement
                    }
                }

                if (foundCb) {
                    inputLen := StrLen(labelTextTrimmed)
                    candidateDiff := Abs(candidate.textLen - inputLen)
                    currentDiff := Abs(matchedTextLen - inputLen)
                    if (!bestCheckbox || candidateDiff < currentDiff) {
                        bestCheckbox := foundCb
                        bestXOffset := foundOffset
                        searchMethod := foundMethod
                        matchedElement := el
                        matchedElementY := elY
                        matchedTextLen := candidate.textLen
                    }
                }
            }
            if (bestCheckbox)
                break
        }

        if (!bestCheckbox) {
            labels := wb.document.getElementsByTagName("label")
            Loop % labels.length {
                lbl := labels[A_Index-1]
                lblText := Trim(lbl.innerText)
                if (lblText = labelTextTrimmed) {
                    checkboxId := lbl.htmlFor
                    if (checkboxId) {
                        cb := wb.document.getElementById(checkboxId)
                        if (cb && cb.type = "checkbox" && IsElementVisible(cb)) {
                            bestCheckbox := cb
                            searchMethod := "label-for"
                            break
                        }
                    }
                }
            }
        }

        if (!bestCheckbox)
            return false

        try bestCheckbox.scrollIntoView(true)
        Sleep, 100
        bestCheckbox.click()
        return true
    } catch {
        return false
    }
}

; =========================
; 특정 텍스트("LMS") 왼쪽 가장 가까운 체크박스 클릭
; =========================
ClickCheckboxLeftOfText(wb, searchText) {
    try {
        doc := wb.document
        searchTrimmed := Trim(searchText)
        refEl := ""
        refX := 0
        refY := 0
        allElements := doc.getElementsByTagName("*")
        Loop % allElements.length {
            el := allElements[A_Index-1]
            try {
                txt := Trim(el.innerText)
                if (txt = searchTrimmed || InStr(txt, searchTrimmed)) {
                    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                        try {
                            rect := el.getBoundingClientRect()
                            refEl := el
                            refX := rect.left + (rect.width / 2)
                            refY := rect.top + (rect.height / 2)
                            break
                        } catch {
                        }
                    }
                }
            } catch {
            }
        }
        if (!refEl)
            return false

        bestCb := ""
        bestDist := 99999
        inputs := doc.getElementsByTagName("input")
        Loop % inputs.length {
            cb := inputs[A_Index-1]
            if (cb.type != "checkbox" || cb.offsetWidth <= 0 || cb.offsetHeight <= 0)
                continue
            try {
                r := cb.getBoundingClientRect()
                cbX := r.left + (r.width / 2)
                cbY := r.top + (r.height / 2)
                xOffset := cbX - refX
                if (xOffset >= 0)
                    continue
                yDiff := Abs(cbY - refY)
                dist := Sqrt(xOffset * xOffset + yDiff * yDiff)
                if (dist < bestDist) {
                    bestDist := dist
                    bestCb := cb
                }
            } catch {
            }
        }
        if (!bestCb)
            return false
        try bestCb.scrollIntoView(true)
        Sleep, 100
        bestCb.click()
        return true
    } catch {
        return false
    }
}

; =========================
; IMAGE 버튼 옆 입력창 클릭 (통합 매크로 빌더 스타일 - 특정텍스트 옆 입력창 클릭)
; - "IMAGE" 텍스트를 찾아 그 왼쪽(같은 행)의 input/textarea/contenteditable 클릭 후 포커스
; =========================
ClickLeftOfButtonByText(wb, buttonText := "IMAGE", offsets := "") {
    doc := wb.document
    if (!IsObject(doc))
        return false

    ; NUI-btn-partial01 클래스로 IMAGE 버튼 찾기
    matchedElements := []
    try {
        btns := doc.getElementsByClassName("NUI-btn-partial01")
        Loop % btns.length {
            btn := btns[A_Index-1]
            try {
                if (btn.tagName != "BUTTON")
                    continue
                btnText := Trim(btn.innerText)
                if (btnText = buttonText && btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                    try {
                        rect := btn.getBoundingClientRect()
                        matchedElements.Push({el: btn, y: rect.top, x: rect.left, textLen: StrLen(btnText)})
                    } catch {
                        matchedElements.Push({el: btn, y: 0, x: 0, textLen: StrLen(btnText)})
                    }
                }
            } catch {
            }
        }
    } catch {
        MsgBox, 48, 오류, getElementsByClassName 실패
        return false
    }

    if (matchedElements.Length() = 0) {
        MsgBox, 48, 오류, IMAGE 버튼을 찾을 수 없습니다.`n`n확인:`n• 페이지에 "IMAGE" 텍스트의 NUI-btn-partial01 버튼이 있는지`n• Edge 탭이 활성화되어 있는지
        return false
    }

    ; 각 매칭 요소에서 왼쪽(xOffset < 0) 입력창 찾기
    for idx, item in matchedElements {
        refEl := item.el
        refY := item.y
        refX := item.x

        ; 2-1) 같은 TR 행에서 입력창 찾기 (왼쪽만)
        parent := refEl
        Loop, 10 {
            if (!parent)
                break
            if (parent.tagName = "TR") {
                validInputs := []
                ; input
                inputs := parent.getElementsByTagName("input")
                Loop % inputs.length {
                    inp := inputs[A_Index-1]
                    if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                        continue
                    if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                        continue
                    try {
                        r := inp.getBoundingClientRect()
                        xOff := r.left - refX
                        if (xOff < 0)  ; 왼쪽
                            validInputs.Push({inp: inp, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                ; textarea
                tas := parent.getElementsByTagName("textarea")
                Loop % tas.length {
                    ta := tas[A_Index-1]
                    if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                        continue
                    try {
                        r := ta.getBoundingClientRect()
                        xOff := r.left - refX
                        if (xOff < 0)
                            validInputs.Push({inp: ta, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                ; contenteditable
                allInRow := parent.getElementsByTagName("*")
                Loop % allInRow.length {
                    e := allInRow[A_Index-1]
                    if (!IsEditableElement(e) || e.tagName = "INPUT" || e.tagName = "TEXTAREA")
                        continue
                    if (e.offsetWidth <= 0 || e.offsetHeight <= 0)
                        continue
                    try {
                        r := e.getBoundingClientRect()
                        xOff := r.left - refX
                        if (xOff < 0)
                            validInputs.Push({inp: e, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                ; 가장 가까운 것 선택 (Y 차이 작은 순 → X 거리 작은 순)
                if (validInputs.Length() > 0) {
                    best := validInputs[1]
                    for i, v in validInputs {
                        if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                            best := v
                    }
                    if (FocusInputElement(best.inp))
                        return true
                }
                break
            }
            parent := parent.parentElement
        }

        ; 2-2) Y좌표 기반 같은 행 검색 (TR 실패 시)
        if (refY > 0) {
            validInputs := []
            allInputs := doc.getElementsByTagName("input")
            Loop % allInputs.length {
                inp := allInputs[A_Index-1]
                if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                    continue
                if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                    continue
                try {
                    r := inp.getBoundingClientRect()
                    yDiff := Abs(r.top - refY)
                    xOff := r.left - refX
                    if (yDiff <= 50 && xOff < 0)
                        validInputs.Push({inp: inp, xOff: Abs(xOff), yDiff: yDiff})
                } catch {
                }
            }
            tas := doc.getElementsByTagName("textarea")
            Loop % tas.length {
                ta := tas[A_Index-1]
                if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                    continue
                try {
                    r := ta.getBoundingClientRect()
                    yDiff := Abs(r.top - refY)
                    xOff := r.left - refX
                    if (yDiff <= 50 && xOff < 0)
                        validInputs.Push({inp: ta, xOff: Abs(xOff), yDiff: yDiff})
                } catch {
                }
            }
            if (validInputs.Length() > 0) {
                best := validInputs[1]
                for i, v in validInputs {
                    if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                        best := v
                }
                if (FocusInputElement(best.inp))
                    return true
            }
        }
    }

    return false
}

; 입력 가능한 요소인지 확인
IsEditableElement(element) {
    try {
        if (element.tagName = "INPUT" || element.tagName = "TEXTAREA")
            return true
        try {
            if (element.contentEditable = "true" || element.contentEditable = "plaintext-only")
                return true
        } catch {
        }
        try {
            if (element.isContentEditable)
                return true
        } catch {
        }
        return false
    } catch {
        return false
    }
}

; 입력창 포커스 (클릭 + focus)
FocusInputElement(element) {
    try {
        element.scrollIntoView()
        Sleep, 80
        element.click()
        Sleep, 50
        element.focus()
        Sleep, 50
        return true
    } catch {
        return false
    }
}

; =========================
; 특정 텍스트("연락처") 아랫쪽에 있는 입력창 포커스
; - label, th, td, span 등에서 텍스트 찾아 바로 아래(r.top >= refBottom) input/textarea 포커스
; =========================
FocusInputBelowText(wb, labelText := "연락처") {
    doc := wb.document
    if (!IsObject(doc))
        return false

    matchedElements := []
    try {
        tagList := "LABEL,TH,TD,SPAN,DIV,LI"
        Loop, Parse, tagList, `,
        {
            tag := A_LoopField
            els := doc.getElementsByTagName(tag)
            Loop % els.length {
                e := els[A_Index-1]
                try {
                    txt := Trim(e.innerText)
                    if (txt = labelText && e.offsetWidth > 0 && e.offsetHeight > 0) {
                        try {
                            rect := e.getBoundingClientRect()
                            refLeft := rect.left
                            refRight := rect.right
                            refBottom := rect.bottom
                            matchedElements.Push({el: e, refLeft: refLeft, refRight: refRight, refBottom: refBottom})
                        } catch {
                        }
                    }
                } catch {
                }
            }
        }
    } catch {
        return false
    }

    if (matchedElements.Length() = 0)
        return false

    for idx, item in matchedElements {
        refLeft := item.refLeft
        refRight := item.refRight
        refBottom := item.refBottom

        ; 같은 부모/컨테이너에서 아랫쪽 입력창 찾기
        validInputs := []
        allInputs := doc.getElementsByTagName("input")
        Loop % allInputs.length {
            inp := allInputs[A_Index-1]
            if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                continue
            if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                continue
            try {
                r := inp.getBoundingClientRect()
                if (r.top >= refBottom - 5) {
                    xOverlap := (r.left < refRight && r.right > refLeft)
                    xAlign := Abs(r.left - refLeft)
                    if (xOverlap || xAlign <= 150) {
                        validInputs.Push({inp: inp, yDist: r.top - refBottom, xAlign: xAlign})
                    }
                }
            } catch {
            }
        }
        tas := doc.getElementsByTagName("textarea")
        Loop % tas.length {
            ta := tas[A_Index-1]
            if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                continue
            try {
                r := ta.getBoundingClientRect()
                if (r.top >= refBottom - 5) {
                    xOverlap := (r.left < refRight && r.right > refLeft)
                    xAlign := Abs(r.left - refLeft)
                    if (xOverlap || xAlign <= 150) {
                        validInputs.Push({inp: ta, yDist: r.top - refBottom, xAlign: xAlign})
                    }
                }
            } catch {
            }
        }
        allInDoc := doc.getElementsByTagName("*")
        Loop % allInDoc.length {
            e := allInDoc[A_Index-1]
            if (!IsEditableElement(e) || e.tagName = "INPUT" || e.tagName = "TEXTAREA")
                continue
            if (e.offsetWidth <= 0 || e.offsetHeight <= 0)
                continue
            try {
                r := e.getBoundingClientRect()
                if (r.top >= refBottom - 5) {
                    xOverlap := (r.left < refRight && r.right > refLeft)
                    xAlign := Abs(r.left - refLeft)
                    if (xOverlap || xAlign <= 150) {
                        validInputs.Push({inp: e, yDist: r.top - refBottom, xAlign: xAlign})
                    }
                }
            } catch {
            }
        }
        if (validInputs.Length() > 0) {
            best := validInputs[1]
            for i, v in validInputs {
                if (v.yDist < best.yDist || (v.yDist = best.yDist && v.xAlign < best.xAlign))
                    best := v
            }
            return FocusInputElement(best.inp)
        }
    }

    return false
}

; =========================
; 특정 텍스트 아랫쪽에 있는 드롭다운(SELECT)에서 옵션 선택
; - 주요쟁점사안 아래 드롭다운 등
; =========================
SelectDropdownBelowText(wb, labelText, optionText) {
    try {
        doc := wb.document
        labelTextTrimmed := Trim(labelText)
        labelNoSpace := StrReplace(labelTextTrimmed, " ", "")
        labelNoSpace := StrReplace(labelNoSpace, A_Tab, "")
        optionTextTrimmed := Trim(optionText)

        ; 텍스트를 포함한 요소 수집 (FocusInputBelowText와 동일 패턴)
        matchedElements := []
        allElements := doc.getElementsByTagName("*")
        Loop % allElements.length {
            el := allElements[A_Index-1]
            try {
                tagName := el.tagName
                if (tagName != "TD" && tagName != "TH" && tagName != "SPAN" && tagName != "DIV" && tagName != "LABEL" && tagName != "P" && tagName != "LI")
                    continue
                elText := Trim(el.innerText)
                elNoSpace := StrReplace(elText, " ", "")
                elNoSpace := StrReplace(elNoSpace, A_Tab, "")
                isMatch := false
                if (elText = labelTextTrimmed)
                    isMatch := true
                else if (elNoSpace = labelNoSpace)
                    isMatch := true
                else if (InStr(elText, labelTextTrimmed) && StrLen(elText) < 100)
                    isMatch := true
                else if (InStr(elNoSpace, labelNoSpace) && StrLen(elText) < 100)
                    isMatch := true
                if (isMatch) {
                    try {
                        rect := el.getBoundingClientRect()
                        matchedElements.Push({el: el, refLeft: rect.left, refRight: rect.right, refBottom: rect.bottom})
                    } catch {
                    }
                }
            } catch {
            }
        }
        if (matchedElements.Length() = 0)
            return false

        ; 각 매칭 요소에서 아랫쪽 SELECT 찾기
        for idx, item in matchedElements {
            refLeft := item.refLeft
            refRight := item.refRight
            refBottom := item.refBottom

            validSelects := []
            selects := doc.getElementsByTagName("select")
            Loop % selects.length {
                sel := selects[A_Index-1]
                if (sel.offsetWidth <= 0 || sel.offsetHeight <= 0)
                    continue
                try {
                    r := sel.getBoundingClientRect()
                    if (r.top >= refBottom - 5) {
                        xOverlap := (r.left < refRight && r.right > refLeft)
                        xAlign := Abs(r.left - refLeft)
                        if (xOverlap || xAlign <= 200) {
                            validSelects.Push({sel: sel, yDist: r.top - refBottom, xAlign: xAlign})
                        }
                    }
                } catch {
                }
            }
            if (validSelects.Length() = 0)
                continue

            ; 가장 가까운 SELECT 선택
            best := validSelects[1]
            for i, v in validSelects {
                if (v.yDist < best.yDist || (v.yDist = best.yDist && v.xAlign < best.xAlign))
                    best := v
            }
            foundSelect := best.sel

            ; 옵션 선택 (통합 매크로 빌더 방식)
            options := foundSelect.getElementsByTagName("option")
            foundOption := ""
            Loop % options.length {
                opt := options[A_Index-1]
                optInnerText := Trim(opt.innerText)
                optValue := Trim(opt.value)
                if (optInnerText = optionTextTrimmed || optValue = optionTextTrimmed) {
                    foundOption := opt
                    break
                }
            }
            if (!foundOption) {
                Loop % options.length {
                    opt := options[A_Index-1]
                    optInnerText := Trim(opt.innerText)
                    optValue := Trim(opt.value)
                    if (SubStr(optInnerText, 1, StrLen(optionTextTrimmed)) = optionTextTrimmed) {
                        foundOption := opt
                        break
                    }
                    if (SubStr(optValue, 1, StrLen(optionTextTrimmed)) = optionTextTrimmed) {
                        foundOption := opt
                        break
                    }
                }
            }
            if (!foundOption)
                return false

            foundSelect.value := foundOption.value
            try {
                evt := doc.createEvent("HTMLEvents")
                evt.initEvent("change", true, true)
                foundSelect.dispatchEvent(evt)
            } catch {
            }
            ToolTip, ✓ %labelText%: %optionText% 선택됨
            SetTimer, RemoveToolTip, -1500
            return true
        }
    } catch e {
        ToolTip, ✗ 드롭다운 선택 실패: %e%
        SetTimer, RemoveToolTip, -2000
    }
    return false
}

; =========================
; 특정 텍스트 우측에 있는 입력창 포커스
; - 사고장소, 사고경위, 관계 법규 및 약관, 세부내용 등
; =========================
FocusInputRightOfText(wb, labelText) {
    doc := wb.document
    if (!IsObject(doc))
        return false

    matchedElements := []
    try {
        tagList := "LABEL,TH,TD,SPAN,DIV,LI"
        Loop, Parse, tagList, `,
        {
            tag := A_LoopField
            els := doc.getElementsByTagName(tag)
            Loop % els.length {
                e := els[A_Index-1]
                try {
                    txt := Trim(e.innerText)
                    if (txt = labelText && e.offsetWidth > 0 && e.offsetHeight > 0) {
                        try {
                            rect := e.getBoundingClientRect()
                            refX := rect.right
                            refY := rect.top
                            matchedElements.Push({el: e, refX: refX, refY: refY})
                        } catch {
                        }
                    }
                } catch {
                }
            }
        }
    } catch {
        return false
    }

    if (matchedElements.Length() = 0)
        return false

    for idx, item in matchedElements {
        refX := item.refX
        refY := item.refY

        ; 같은 TR 행에서 우측 입력창 찾기
        parent := item.el
        Loop, 10 {
            if (!parent)
                break
            if (parent.tagName = "TR") {
                validInputs := []
                inputs := parent.getElementsByTagName("input")
                Loop % inputs.length {
                    inp := inputs[A_Index-1]
                    if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                        continue
                    if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                        continue
                    try {
                        r := inp.getBoundingClientRect()
                        if (r.left >= refX - 5)
                            validInputs.Push({inp: inp, xOff: r.left - refX, yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                tas := parent.getElementsByTagName("textarea")
                Loop % tas.length {
                    ta := tas[A_Index-1]
                    if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                        continue
                    try {
                        r := ta.getBoundingClientRect()
                        if (r.left >= refX - 5)
                            validInputs.Push({inp: ta, xOff: r.left - refX, yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                allInRow := parent.getElementsByTagName("*")
                Loop % allInRow.length {
                    el := allInRow[A_Index-1]
                    if (!IsEditableElement(el) || el.tagName = "INPUT" || el.tagName = "TEXTAREA")
                        continue
                    if (el.offsetWidth <= 0 || el.offsetHeight <= 0)
                        continue
                    try {
                        r := el.getBoundingClientRect()
                        if (r.left >= refX - 5)
                            validInputs.Push({inp: el, xOff: r.left - refX, yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                if (validInputs.Length() > 0) {
                    best := validInputs[1]
                    for i, v in validInputs {
                        if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                            best := v
                    }
                    return FocusInputElement(best.inp)
                }
                break
            }
            parent := parent.parentElement
        }

        ; TR 실패 시 Y좌표 기반 검색 (우측)
        validInputs := []
        allInputs := doc.getElementsByTagName("input")
        Loop % allInputs.length {
            inp := allInputs[A_Index-1]
            if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                continue
            if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                continue
            try {
                r := inp.getBoundingClientRect()
                yDiff := Abs(r.top - refY)
                if (yDiff <= 50 && r.left >= refX - 5)
                    validInputs.Push({inp: inp, xOff: r.left - refX, yDiff: yDiff})
            } catch {
            }
        }
        tas := doc.getElementsByTagName("textarea")
        Loop % tas.length {
            ta := tas[A_Index-1]
            if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                continue
            try {
                r := ta.getBoundingClientRect()
                yDiff := Abs(r.top - refY)
                if (yDiff <= 50 && r.left >= refX - 5)
                    validInputs.Push({inp: ta, xOff: r.left - refX, yDiff: yDiff})
            } catch {
            }
        }
        if (validInputs.Length() > 0) {
            best := validInputs[1]
            for i, v in validInputs {
                if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                    best := v
            }
            return FocusInputElement(best.inp)
        }
    }

    return false
}

; =========================
; 특정 텍스트("선택")가 있는 버튼 우측에 있는 입력창 포커스
; - button, span, a 태그에서 btnText 포함 요소 찾아 우측 input/textarea 포커스
; =========================
FocusInputRightOfButtonByText(wb, btnText := "선택") {
    doc := wb.document
    if (!IsObject(doc))
        return false

    matchedElements := []
    btnTextTrimmed := Trim(btnText)
    try {
        tagList := "BUTTON,SPAN,A"
        Loop, Parse, tagList, `,
        {
            tag := A_LoopField
            els := doc.getElementsByTagName(tag)
            Loop % els.length {
                e := els[A_Index-1]
                try {
                    txt := Trim(e.innerText)
                    if (InStr(txt, btnTextTrimmed) && e.offsetWidth > 0 && e.offsetHeight > 0) {
                        try {
                            rect := e.getBoundingClientRect()
                            refX := rect.right
                            refY := rect.top
                            matchedElements.Push({el: e, refX: refX, refY: refY})
                        } catch {
                        }
                    }
                } catch {
                }
            }
        }
    } catch {
        return false
    }

    if (matchedElements.Length() = 0)
        return false

    for idx, item in matchedElements {
        refX := item.refX
        refY := item.refY

        ; 같은 TR 행에서 우측 입력창 찾기
        parent := item.el
        Loop, 10 {
            if (!parent)
                break
            if (parent.tagName = "TR") {
                validInputs := []
                inputs := parent.getElementsByTagName("input")
                Loop % inputs.length {
                    inp := inputs[A_Index-1]
                    if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                        continue
                    if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                        continue
                    try {
                        r := inp.getBoundingClientRect()
                        if (r.left >= refX - 5)
                            validInputs.Push({inp: inp, xOff: r.left - refX, yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                tas := parent.getElementsByTagName("textarea")
                Loop % tas.length {
                    ta := tas[A_Index-1]
                    if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                        continue
                    try {
                        r := ta.getBoundingClientRect()
                        if (r.left >= refX - 5)
                            validInputs.Push({inp: ta, xOff: r.left - refX, yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                allInRow := parent.getElementsByTagName("*")
                Loop % allInRow.length {
                    el := allInRow[A_Index-1]
                    if (!IsEditableElement(el) || el.tagName = "INPUT" || el.tagName = "TEXTAREA")
                        continue
                    if (el.offsetWidth <= 0 || el.offsetHeight <= 0)
                        continue
                    try {
                        r := el.getBoundingClientRect()
                        if (r.left >= refX - 5)
                            validInputs.Push({inp: el, xOff: r.left - refX, yDiff: Abs(r.top - refY)})
                    } catch {
                    }
                }
                if (validInputs.Length() > 0) {
                    best := validInputs[1]
                    for i, v in validInputs {
                        if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                            best := v
                    }
                    return FocusInputElement(best.inp)
                }
                break
            }
            parent := parent.parentElement
        }

        ; TR 실패 시 Y좌표 기반 검색 (우측)
        validInputs := []
        allInputs := doc.getElementsByTagName("input")
        Loop % allInputs.length {
            inp := allInputs[A_Index-1]
            if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                continue
            if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                continue
            try {
                r := inp.getBoundingClientRect()
                yDiff := Abs(r.top - refY)
                if (yDiff <= 50 && r.left >= refX - 5)
                    validInputs.Push({inp: inp, xOff: r.left - refX, yDiff: yDiff})
            } catch {
            }
        }
        tas := doc.getElementsByTagName("textarea")
        Loop % tas.length {
            ta := tas[A_Index-1]
            if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                continue
            try {
                r := ta.getBoundingClientRect()
                yDiff := Abs(r.top - refY)
                if (yDiff <= 50 && r.left >= refX - 5)
                    validInputs.Push({inp: ta, xOff: r.left - refX, yDiff: yDiff})
            } catch {
            }
        }
        if (validInputs.Length() > 0) {
            best := validInputs[1]
            for i, v in validInputs {
                if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                    best := v
            }
            return FocusInputElement(best.inp)
        }
    }

    return false
}

; =========================
; 캘린더 버튼 옆 입력창 포커스 (처리일자)
; - class: calendar-btn 찾아 왼쪽(같은 행) input/textarea/contenteditable 포커스
; =========================
ClickLeftOfCalendarButton(wb, offsetPx := "") {
    doc := wb.document
    if (!IsObject(doc))
        return false

    ; calendar-btn 찾기
    refEl := ""
    try {
        classEls := doc.getElementsByClassName("calendar-btn")
        Loop % classEls.length {
            e := classEls[A_Index-1]
            if (e.offsetWidth > 0 && e.offsetHeight > 0) {
                refEl := e
                break
            }
        }
    } catch {
        return false
    }

    if (!IsObject(refEl))
        return false

    try {
        rect := refEl.getBoundingClientRect()
        refY := rect.top
        refX := rect.left
    } catch {
        return false
    }

    ; 같은 TR에서 왼쪽 입력창 찾기
    parent := refEl
    Loop, 10 {
        if (!parent)
            break
        if (parent.tagName = "TR") {
            validInputs := []
            inputs := parent.getElementsByTagName("input")
            Loop % inputs.length {
                inp := inputs[A_Index-1]
                if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                    continue
                if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                    continue
                try {
                    r := inp.getBoundingClientRect()
                    xOff := r.left - refX
                    if (xOff < 0)
                        validInputs.Push({inp: inp, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                } catch {
                }
            }
            tas := parent.getElementsByTagName("textarea")
            Loop % tas.length {
                ta := tas[A_Index-1]
                if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                    continue
                try {
                    r := ta.getBoundingClientRect()
                    xOff := r.left - refX
                    if (xOff < 0)
                        validInputs.Push({inp: ta, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                } catch {
                }
            }
            allInRow := parent.getElementsByTagName("*")
            Loop % allInRow.length {
                e := allInRow[A_Index-1]
                if (!IsEditableElement(e) || e.tagName = "INPUT" || e.tagName = "TEXTAREA")
                    continue
                if (e.offsetWidth <= 0 || e.offsetHeight <= 0)
                    continue
                try {
                    r := e.getBoundingClientRect()
                    xOff := r.left - refX
                    if (xOff < 0)
                        validInputs.Push({inp: e, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                } catch {
                }
            }
            if (validInputs.Length() > 0) {
                best := validInputs[1]
                for i, v in validInputs {
                    if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                        best := v
                }
                return FocusInputElement(best.inp)
            }
            break
        }
        parent := parent.parentElement
    }

    ; TR 실패 시 Y좌표 기반 검색
    validInputs := []
    allInputs := doc.getElementsByTagName("input")
    Loop % allInputs.length {
        inp := allInputs[A_Index-1]
        if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
            continue
        if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
            continue
        try {
            r := inp.getBoundingClientRect()
            yDiff := Abs(r.top - refY)
            xOff := r.left - refX
            if (yDiff <= 50 && xOff < 0)
                validInputs.Push({inp: inp, xOff: Abs(xOff), yDiff: yDiff})
        } catch {
        }
    }
    tas := doc.getElementsByTagName("textarea")
    Loop % tas.length {
        ta := tas[A_Index-1]
        if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
            continue
        try {
            r := ta.getBoundingClientRect()
            yDiff := Abs(r.top - refY)
            xOff := r.left - refX
            if (yDiff <= 50 && xOff < 0)
                validInputs.Push({inp: ta, xOff: Abs(xOff), yDiff: yDiff})
        } catch {
        }
    }
    if (validInputs.Length() > 0) {
        best := validInputs[1]
        for i, v in validInputs {
            if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                best := v
        }
        return FocusInputElement(best.inp)
    }

    return false
}

; =========================
; NUI-find 버튼 왼쪽 입력창 포커스
; - class: NUI-btn-ico NUI-find 찾아 왼쪽(같은 행) input/textarea/contenteditable 포커스
; =========================
ClickLeftOfFindButton(wb) {
    doc := wb.document
    if (!IsObject(doc))
        return false

    ; NUI-btn-ico NUI-find 버튼 찾기
    refEl := ""
    try {
        classEls := doc.getElementsByClassName("NUI-find")
        Loop % classEls.length {
            e := classEls[A_Index-1]
            try {
                cls := e.className
                if (InStr(cls, "NUI-btn-ico") && e.offsetWidth > 0 && e.offsetHeight > 0) {
                    refEl := e
                    break
                }
            } catch {
            }
        }
    } catch {
        return false
    }

    if (!IsObject(refEl))
        return false

    try {
        rect := refEl.getBoundingClientRect()
        refY := rect.top
        refX := rect.left
    } catch {
        return false
    }

    ; 같은 TR에서 왼쪽 입력창 찾기
    parent := refEl
    Loop, 10 {
        if (!parent)
            break
        if (parent.tagName = "TR") {
            validInputs := []
            inputs := parent.getElementsByTagName("input")
            Loop % inputs.length {
                inp := inputs[A_Index-1]
                if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
                    continue
                if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
                    continue
                try {
                    r := inp.getBoundingClientRect()
                    xOff := r.left - refX
                    if (xOff < 0)
                        validInputs.Push({inp: inp, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                } catch {
                }
            }
            tas := parent.getElementsByTagName("textarea")
            Loop % tas.length {
                ta := tas[A_Index-1]
                if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
                    continue
                try {
                    r := ta.getBoundingClientRect()
                    xOff := r.left - refX
                    if (xOff < 0)
                        validInputs.Push({inp: ta, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                } catch {
                }
            }
            allInRow := parent.getElementsByTagName("*")
            Loop % allInRow.length {
                e := allInRow[A_Index-1]
                if (!IsEditableElement(e) || e.tagName = "INPUT" || e.tagName = "TEXTAREA")
                    continue
                if (e.offsetWidth <= 0 || e.offsetHeight <= 0)
                    continue
                try {
                    r := e.getBoundingClientRect()
                    xOff := r.left - refX
                    if (xOff < 0)
                        validInputs.Push({inp: e, xOff: Abs(xOff), yDiff: Abs(r.top - refY)})
                } catch {
                }
            }
            if (validInputs.Length() > 0) {
                best := validInputs[1]
                for i, v in validInputs {
                    if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                        best := v
                }
                return FocusInputElement(best.inp)
            }
            break
        }
        parent := parent.parentElement
    }

    ; TR 실패 시 Y좌표 기반 검색
    validInputs := []
    allInputs := doc.getElementsByTagName("input")
    Loop % allInputs.length {
        inp := allInputs[A_Index-1]
        if (inp.type = "checkbox" || inp.type = "radio" || inp.type = "hidden" || inp.type = "button" || inp.type = "submit")
            continue
        if (inp.offsetWidth <= 0 || inp.offsetHeight <= 0)
            continue
        try {
            r := inp.getBoundingClientRect()
            yDiff := Abs(r.top - refY)
            xOff := r.left - refX
            if (yDiff <= 50 && xOff < 0)
                validInputs.Push({inp: inp, xOff: Abs(xOff), yDiff: yDiff})
        } catch {
        }
    }
    tas := doc.getElementsByTagName("textarea")
    Loop % tas.length {
        ta := tas[A_Index-1]
        if (ta.offsetWidth <= 0 || ta.offsetHeight <= 0)
            continue
        try {
            r := ta.getBoundingClientRect()
            yDiff := Abs(r.top - refY)
            xOff := r.left - refX
            if (yDiff <= 50 && xOff < 0)
                validInputs.Push({inp: ta, xOff: Abs(xOff), yDiff: yDiff})
        } catch {
        }
    }
    if (validInputs.Length() > 0) {
        best := validInputs[1]
        for i, v in validInputs {
            if (v.yDiff < best.yDiff || (v.yDiff = best.yDiff && v.xOff < best.xOff))
                best := v
        }
        return FocusInputElement(best.inp)
    }

    return false
}

; =========================
; Edge 윈도우 감지 (로딩용)
; =========================
GetActiveIEWindow() {
    hwnd := WinActive("A")
    if !hwnd
        return 0
    doc := GetIEModeDocumentFromEdgeWindow(hwnd)
    if IsObject(doc)
        return { document: doc }
    return 0
}

GetIEModeDocumentFromEdgeWindow(hwndEdge, wantTitle="") {
    childs := EnumAllChildWindows(hwndEdge)
    if !IsObject(childs)
        return 0
    for i, h in childs {
        cls := ""
        WinGetClass, cls, ahk_id %h%
        if (cls != "Internet Explorer_Server")
            continue
        err := ""
        doc := HtmlDocFromIEServerHwnd(h, err)
        if !IsObject(doc)
            continue
        if (wantTitle = "")
            return doc
        t := ""
        try
            t := doc.title
        catch
            t := ""
        if (t != "" && InStr(t, wantTitle))
            return doc
    }
    return 0
}

HtmlDocFromIEServerHwnd(hIEServer, ByRef err:="") {
    err := ""
    static msg := DllCall("RegisterWindowMessage", "str", "WM_HTML_GETOBJECT")
    SendMessage, %msg%, 0, 0,, ahk_id %hIEServer%
    if (ErrorLevel != "FAIL") {
        lResult := ErrorLevel
        VarSetCapacity(IID_IDispatch, 16, 0)
        DllCall("ole32\CLSIDFromString", "wstr", "{00020400-0000-0000-C000-000000000046}", "ptr", &IID_IDispatch)
        pdisp := 0
        hr := DllCall("oleacc\ObjectFromLresult", "ptr", lResult, "ptr", &IID_IDispatch, "ptr", 0, "ptr*", pdisp)
        if (hr = 0 && pdisp) {
            obj := ComObj(9, pdisp, 1)
            try {
                d := obj.document
                if IsObject(d)
                    return d
            } catch {
            }
            return obj
        }
    }
    VarSetCapacity(IID_IDispatch2, 16, 0)
    DllCall("ole32\CLSIDFromString", "wstr", "{00020400-0000-0000-C000-000000000046}", "ptr", &IID_IDispatch2)
    pacc := 0
    hr2 := DllCall("oleacc\AccessibleObjectFromWindow", "ptr", hIEServer, "uint", 0xFFFFFFF0, "ptr", &IID_IDispatch2, "ptr*", pacc)
    if (hr2 = 0 && pacc) {
        obj2 := ComObj(9, pacc, 1)
        try {
            d2 := obj2.document
            if IsObject(d2)
                return d2
        } catch {
        }
        return obj2
    }
    return 0
}

EnumAllChildWindows(hwndParent) {
    global __childList, __enumCB
    __childList := []
    if (!__enumCB)
        __enumCB := RegisterCallback("____EnumChildProc", "Fast")
    DllCall("EnumChildWindows", "ptr", hwndParent, "ptr", __enumCB, "ptr", 0)
    return __childList
}

____EnumChildProc(hwnd, lParam) {
    global __childList
    __childList.Push(hwnd)
    return true
}

; =========================
; 로딩 감지: NUI-loading
; =========================
WaitForLoadingComplete(wb, maxWaitMs := 10000) {
    if !wb
        return false

    startTime := A_TickCount

    Loop {
        elapsed := A_TickCount - startTime
        if (elapsed > maxWaitMs)
            return false

        try {
            loadingEls := wb.document.getElementsByClassName("NUI-loading")
            if (loadingEls.length > 0) {
                el := loadingEls[0]
                try {
                    display := el.currentStyle.display
                    width := el.offsetWidth
                    height := el.offsetHeight
                    if (display = "none" && width = 0 && height = 0) {
                        Sleep, 100
                        return true
                    }
                } catch {
                    return true
                }
            } else {
                return true
            }
        } catch {
            return true
        }
        Sleep, 100
    }
}

; =========================
; 엑셀 읽기 (ComObjActive/ComObjGet) - A,B,C
; =========================
ReadExcelData(filePath := "") {
    global ExcelDataCache, MAX_ROWS

    xl := ""
    Loop, 3 {
        try {
            xl := ComObjActive("Excel.Application")
            if (IsObject(xl))
                break
        } catch {
        }
        Sleep, 100
    }
    if (!IsObject(xl)) {
        ahk64 := (A_PtrSize = 8)
        hint := "Excel이 32비트라면 AHK도 32비트로 실행해야 합니다.`n(스크립트 우클릭 → Compile Script → 32-bit로 컴파일)"
        MsgBox, 48, 엑셀 연결 실패, Excel에 연결할 수 없습니다.`n`n현재 AHK: %ahk64% (Yes=64비트, No=32비트)`n`n%hint%
        return false
    }

    ; 워크북/시트 정보 확인
    wbCount := 0
    try
        wbCount := xl.Workbooks.Count
    catch
        wbCount := 0
    
    if (wbCount = 0) {
        MsgBox, 48, 오류, 열린 엑셀 파일이 없습니다.`n`n엑셀에서 파일을 먼저 열어주세요.
        return false
    }

    ; 워크북/시트 정보 확인
    ws := ""
    try {
        ws := xl.Workbooks(1).Sheets(1)
    } catch {
        MsgBox, 48, 오류, 시트 접근 실패`n`n워크북 개수: %wbCount%`n첫 번째 워크북의 첫 번째 시트를 찾을 수 없습니다.
        return false
    }

    if (!IsObject(ws)) {
        MsgBox, 48, 오류, 시트 객체 없음`n`nWorkbooks(1).Sheets(1)가 객체를 반환하지 않았습니다.
        return false
    }

    dataRows := []

    ; 마지막 행
    maxRow := 200
    try
        maxRow := ws.UsedRange.Rows.Count
    catch
        maxRow := 200
    if (maxRow <= 0)
        maxRow := 200
    if (maxRow > MAX_ROWS)
        maxRow := MAX_ROWS

    ; 데이터 읽기 (2행부터)
    startRow := 2
    if (maxRow < startRow)
        return dataRows
    Loop, % (maxRow - startRow + 1) {
        row := A_Index + startRow - 1
        rowData := {}
        hasData := false

        ; A열
        valA := ""
        try valA := ws.Cells(row, 1).Value
        valA := valA . ""
        rowData["A"] := valA
        if (Trim(valA) != "")
            hasData := true

        ; B열
        valB := ""
        try valB := ws.Cells(row, 2).Value
        valB := valB . ""
        rowData["B"] := valB
        if (Trim(valB) != "")
            hasData := true

        ; C열
        valC := ""
        try valC := ws.Cells(row, 3).Value
        valC := valC . ""
        rowData["C"] := valC
        if (Trim(valC) != "")
            hasData := true

        if (hasData)
            dataRows.Push(rowData)
    }

    return dataRows
}
