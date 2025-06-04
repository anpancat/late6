import { useState, useEffect } from "react";
import { db, collection, addDoc } from "./firebaseConfig"; // firebase 인증 모듈 불러오기

const getReturnURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("return") || "퀄트릭스 설문문항 링크"; 
};

export default function WritingTest() {
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const requiredWords = ["친구", "놀란", "강아지"];
  const [displayText, setDisplayText] = useState("");
  const predefinedText1 = "따스한 햇살이 골목길을 비추고, 나뭇잎 사이로 부는 바람이 잔잔한 소리를 냈다. 담벼락에는 고양이가 졸고 있었고, 창문 너머로 김이 서린 찻잔이 보였다. 조용한 거리에 어울리지 않게 어디선가 작은 발소리가 들려오고, 고개를 들어 소리가 난 곳을 찾아 두리번거리자 멀리서 낯선 그림자를 발견했다. "; // 미리 정해진 문장 삽입
  const predefinedText2 = "예시문장2 ";
  const predefinedText3 = "예시문장3 ";
  const predefinedText4 = "예시문장4 ";
  const predefinedText5 = "예시문장5 ";
  const predefinedText6 = "예시문장6 ";
  const [preTextIndex, setPreTextIndex] = useState(0);
  const [isPreTextTyping, setIsPreTextTyping] = useState(""); // 타이핑 중인 글자 저장
  const [preTextTyping, setPreTextTyping] = useState("");   // 타이핑 중인 글자
  const [originalText, setOriginalText] = useState("");     // 기존 작성 글 보존
  const [predefinedText, setPredefinedText] = useState("");

  const typingText = "...DraftMind가 입력중 입니다..."; //입력중
  const hello = "안녕하세요! 저는 글쓰기를 도와주기 위해 만들어진 AI 'DraftMind' 이에요. \n당신은 지금 이야기를 창작중인 것으로 보이네요. 당신의 글쓰기를 돕게 되어 기뻐요!"; // 인사말
  const fullText = "일반적인 글쓰기 원칙과 스토리텔링 전략에 기반해서 도움을 제공해드릴게요. \n글의 초반부에 배경을 자세히 묘사해서 이야기를 더욱 생생하게 만들어보세요. 이야기의 몰입감을 높이는 데에 도움이 될거에요.\n예시 문장을 제공해드릴게요!"; // AI 글쓰기 제안문구
  const examplePhrase1 = ["따스한 햇살이", "골목길을 비추고", "나뭇잎 사이로 부는 바람이", "잔잔한 소리를 냈다", "담벼락에는 고양이가 졸고 있었고", "창문 너머로", "김이 서린 찻잔이 보였다", "조용한 거리에", "어울리지 않게", "어디선가 작은 발소리가 들려오고", "고개를 들어", "소리가 난 곳을 찾아 두리번거리자", "멀리서 낯선 그림자를 발견했다"];  // 예시 구문들
  const examplePhrase2 = ["예시구문2"];
  const examplePhrase3 = ["예시구문3"];
  const examplePhrase4 = ["예시구문4"];
  const examplePhrase5 = ["예시구문5"];
  const examplePhrase6 = ["예시구문6"];
  const exampleKeywords1 = ["따스한", "햇살", "골목길", "비추고", "나뭇잎", "사이", "부는", "바람", "잔잔한", "소리", "냈다", "담벼락", "고양이", "졸고", "있었고", "창문", "너머", "김", "서린", "찻잔", "보였다", "조용한", "거리", "어울리지", "않게", "어디선가", "작은", "발소리", "들려오고", "고개", "들어", "난", "곳", "찾아", "두리번거리자", "멀리서", "낯선", "그림자", "발견했다"]; // 예시 단어들
  const exampleKeywords2 = ["예시단어2"];
  const exampleKeywords3 = ["예시단어3"];
  const exampleKeywords4 = ["예시단어4"];
  const exampleKeywords5 = ["예시단어5"];
  const exampleKeywords6 = ["예시단어6"];


  const [typingIndex, setTypingIndex] = useState(0);
  const [helloIndex, setHelloIndex] = useState(0);
  const [fullTextIndex, setFullTextIndex] = useState(0);

  const [isTypingTextComplete, setIsTypingTextComplete] = useState(false);
  const [isHelloTyping, setIsHelloTyping] = useState(false);
  const [isFullTextTyping, setIsFullTextTyping] = useState(false);
  const [hasTriggeredOnce, setHasTriggeredOnce] = useState(false);

  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [showInputLockMessage, setShowInputLockMessage] = useState(false);

  const [warning, setWarning] = useState("");
  const [missingWords, setMissingWords] = useState([]);

  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState([null, null, null, null]);
  const [startTypingFlow, setStartTypingFlow] = useState(false);  // 최초 트리거 시점


  const [selectedExampleIndex, setSelectedExampleIndex] = useState(null);  // 1 또는 2
  const [showExampleChoice, setShowExampleChoice] = useState(false);
  
  // ✨ Prolific ID 상태 추가
  const [prolificId, setProlificId] = useState("");

  // 🔥 입력 잠금 메시지 상태 추가
  useEffect(() => {
    setShowInputLockMessage(isInputDisabled);
  }, [isInputDisabled]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
  
    let warningMessages = []; // 여러 개의 경고 메시지를 저장할 배열
  
    // 🔥 단어 수 계산 (입력된 텍스트가 비어있으면 0으로 설정)
    let words = newText.trim().length === 0 ? [] : newText.trim().split(/\s+/);
  
    // ✅ 5단어 이상 입력된 경우에만 단어 반복 검사 실행
    if (words.length > 5) {
      // 🔥 같은 단어 반복 확인 및 하나만 입력 방지
      const wordCounts = {};
      words.forEach((word) => {
        word = word.replace(/[.,!?]/g, ""); // 🔥 문장부호 제거 후 단어 카운트
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
  
      // 🔥 중복 단어 비율 계산 (전체 단어의 30% 이상이 동일한 단어면 경고)
      const overusedWords = Object.entries(wordCounts)
        .filter(([_, count]) => count / words.length > 0.3)
        .map(([word]) => word);
  
      if (overusedWords.length > 0) {
        words = words.filter((word) => !overusedWords.includes(word));
        warningMessages.push(`동일 글자의 반복이 감지되었습니다: ${overusedWords.join(", ")}`);
      }
  
    } 
      setWordCount(words.length); // 1단어만 입력되었을 때도 정상적으로 카운트
    
  
    // 🔥 필수 단어 포함 여부 확인
    const rootWords = ["친구", "놀란", "강아지"];
    const missing = rootWords.filter((requiredRoot) =>
      !words.some((w) => w.replace(/[.,!?]/g, "").includes(requiredRoot)) // 🔥 문장부호 제거 후 비교
    );
  
    setMissingWords(missing);

    if (missing.length > 0) {
      warningMessages.push(`다음 제시어가 반드시 들어가야 합니다: ${missing.join(", ")}`);
    }
  
    // 🔥 중복 제거 후 경고 메시지 설정
    setWarning([...new Set(warningMessages)]);
  };
  
  const handleExampleChoice = (choiceIndex) => {
    setSelectedExampleIndex(choiceIndex);
    setShowExampleChoice(false);

    const choiceMap = {
      1: predefinedText1,
      2: predefinedText2,
      3: predefinedText3,
      4: predefinedText4,
      5: predefinedText5,
      6: predefinedText6,
    };

    const chosenText = choiceMap[choiceIndex] || "";
    setPreTextIndex(0);
    setPreTextTyping("");
    setOriginalText(text);
    setIsPreTextTyping(true);
    setPredefinedText(chosenText);
  };

  useEffect(() => {
    if (wordCount >= 80 && !hasTriggeredOnce) {
      setIsInputDisabled(true); // ✅ 입력창 비활성화 추가
      setShowSurveyModal(true); // 설문 팝업 띄우기
    }
  }, [wordCount, hasTriggeredOnce]);

useEffect(() => {
    if (hasTriggeredOnce && surveyCompleted) {
      // 출력창 초기화 + 타이핑 효과 시작
      setDisplayText("");
      setTypingIndex(0);
      setHelloIndex(0);
      setFullTextIndex(0);

      setIsTypingTextComplete(false);
      setIsHelloTyping(false);
      setIsFullTextTyping(false);
        
      // ✅ 2초 뒤에 타이핑 시작 (겹침 방지)
      const timer = setTimeout(() => {
        setStartTypingFlow(true); // 타이핑 시작
      }, 1000);
    
      return () => clearTimeout(timer); // 혹시 컴포넌트 unmount 시 타이머 제거
    }
  }, [hasTriggeredOnce, surveyCompleted]);

  // 🪶 typingText 타이핑 효과 처리
  useEffect(() => {
    if (startTypingFlow && !isTypingTextComplete && typingIndex < typingText.length) {
      const timer = setTimeout(() => {
        setDisplayText(typingText.slice(0, typingIndex + 1));
        setTypingIndex(typingIndex + 1);
      }, 50);
      return () => clearTimeout(timer);
    }

    if (startTypingFlow && typingIndex === typingText.length && !isTypingTextComplete) {
      setTimeout(() => {
        setIsTypingTextComplete(true);
        setDisplayText("");      // 출력창 비우기
        setHelloIndex(0);        // hello 시작 준비
        setIsHelloTyping(true);  // ✅ 이제 hello 시작
      }, 1000);
    }
  }, [startTypingFlow, typingIndex, isTypingTextComplete]);


  // 인사말 타이핑효과
  useEffect(() => {
    if (isHelloTyping && helloIndex < hello.length) {
      const timer = setTimeout(() => {
        setDisplayText(hello.slice(0, helloIndex + 1));
        setHelloIndex(helloIndex + 1);
      }, 35);
      return () => clearTimeout(timer);
    }

    if (helloIndex === hello.length) {
      setTimeout(() => {
        setDisplayText(""); // 개인화수준 타이핑 시작 전 초기화
        setIsHelloTyping(false);
        setIsFullTextTyping(true);
      }, 2000);
    }
  }, [helloIndex, isHelloTyping]);

  // AI 글쓰기 제안문구 타이핑효과
  useEffect(() => {
    if (isFullTextTyping && fullTextIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, fullTextIndex + 1));
        setFullTextIndex(fullTextIndex + 1);
      }, 30);

      return () => clearTimeout(timer);
    }
    if (isFullTextTyping && fullTextIndex >= fullText.length) {
      setTimeout(() => {
        setIsFullTextTyping(false);
        setShowExampleChoice(true);  // 예시 선택창 열기
      }, 2000);
    }
  }, [fullTextIndex, isFullTextTyping]);

  // 미리 정해진 문장 타이핑효과
  useEffect(() => {
    // 타이핑 시작 시점에 기존 글 저장
    if (isPreTextTyping && preTextIndex === 0) {
      setOriginalText(text);
    }

    //타이핑 효과 진행
    if (isPreTextTyping && preTextIndex < predefinedText.length) {
      const timer = setTimeout(() => {
        setPreTextTyping(predefinedText.slice(0, preTextIndex + 1));
        setPreTextIndex(preTextIndex + 1);
      }, 50);  // 타이핑 속도 조절
  
      return () => clearTimeout(timer);
    }
  
    if (isPreTextTyping && preTextIndex >= predefinedText.length) {
      setTimeout(() => {
        if (!originalText.startsWith(predefinedText)) {
          setText(predefinedText + originalText);   // 최종 텍스트 반영
        } else {
          setText(originalText);   // 이미 삽입된 경우 유지
        }

        // ✅ 여기서 단어 수 갱신
        const finalText = !originalText.startsWith(predefinedText)
          ? predefinedText + originalText
          : originalText;

        const words = finalText.trim().split(/\s+/);
        setText(finalText); // 최종 텍스트 반영
        setWordCount(words.length);
        handleChange({ target: { value: finalText } });

        setIsPreTextTyping(false);
        setIsInputDisabled(false);   // 타이핑 끝난 후 입력창 활성화
      }, 1000);
    }
  }, [isPreTextTyping, preTextIndex]);
  


  // 🔥 Firestore에 데이터 저장하는 함수 추가
  const handleSubmit = async () => {
    let errorMessages = []; 

    // 단어 수 체크
    if (wordCount < 100) {
      errorMessages.push("❌ 단어 수가 부족합니다 (최소 100 단어).");
    }
    if (wordCount > 150) {
      errorMessages.push("❌ 단어 수가 초과되었습니다 (최대 150 단어).");
    }


    // 필수 단어 포함 여부 확인
    if (missingWords.length > 0) {
      errorMessages.push(`❌ 다음 제시어가 반드시 들어가야 합니다: ${missingWords.join(", ")}`);
    }

    // ✨ Qualtrics ID 미입력 시 에러 메시지 추가
    if (!prolificId.trim()) {
      errorMessages.push("❌ 엠브레인 ID를 적어주세요.");
    }


    // 🔥 오류 메시지가 하나라도 있으면 제출 불가
    if (errorMessages.length > 0) {
      alert(`⚠️ 다음과 같은 이유로 제출이 실패되었습니다:\n\n${errorMessages.join("\n")}`);
      return;
    }

    try {
      // 예시 단어 및 구문 매핑
      const keywordMap = {
        1: exampleKeywords1,
        2: exampleKeywords2,
        3: exampleKeywords3,
        4: exampleKeywords4,
        5: exampleKeywords5,
        6: exampleKeywords6,
      };

      const phraseMap = {
        1: examplePhrase1,
        2: examplePhrase2,
        3: examplePhrase3,
        4: examplePhrase4,
        5: examplePhrase5,
        6: examplePhrase6,
      };

      // 매칭 계산
      const textWords = text.trim().match(/[가-힣]+/g) || [];
      const selectedKeywords = keywordMap[selectedExampleIndex] || [];
      const selectedPhrases = phraseMap[selectedExampleIndex] || [];

      const matchedWords = selectedKeywords.filter(keyword =>
        textWords.some(word => word.includes(keyword))
      );
      const matchedPhrase = selectedPhrases.filter(phrase =>
        text.trim().includes(phrase)
      );

      const exampleWordCount = matchedWords.length;
      const examplePhraseCount = matchedPhrase.length;
      const exampleWordSetLabel = `exampleKeywords${selectedExampleIndex}`;
      const examplePhraseSetLabel = `examplePhrase${selectedExampleIndex}`;


      

      // 현재 한국 시간(KST) 가져오기
      const koreaTime = new Date();
      // 한국 시간의 날짜와 시간을 문자열로 변환
      const formatter = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul", 
        year: "numeric", 
        month: "2-digit", 
        day: "2-digit", 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit"
      });

      const formattedKoreaTime = formatter.format(koreaTime);

      //firebase에 UID 포함하여 데이터에 저장
      await addDoc(collection(db, "후기-6"), {
        SONAId: prolificId.trim(), // ✨ prolific ID 저장
        timestamp: formattedKoreaTime,  // ✅ 한국 시간으로 변환한 값 저장
        // ✨ 설문 응답 추가 저장
        PO_q1: surveyAnswers[0],
        PO_q2: surveyAnswers[1],
        PO_q3: surveyAnswers[2],
        PO_q4: surveyAnswers[3],
        selectedExampleIndex: selectedExampleIndex, // 선택한 predefinedText 번호 저장
        exampleWordSource: exampleWordSetLabel, // 어떤 예시단어셋을 기준으로 했는지 저장
        exampleWordCount: exampleWordCount, // 예시단어 매칭개수
        exampleWords: matchedWords.join(", "), // 예시단어 매칭된 단어들
        examplePhraseSource: examplePhraseSetLabel, // 어떤 예시구문셋을 기준으로 했는지 저장
        examplePhraseCount: examplePhraseCount, // 예시구문 매칭개수
        examplePhrases: matchedPhrase.join(", "), // 예시구문 매칭된 구문들
        text: text.trim(),
        wordCount: wordCount
      });

      alert("✅ 작성하신 글이 성공적으로 제출되었습니다!");
      setText("");
      setWordCount(0);
      setWarning("");
      setProlificId(""); // ✨ 제출 성공 시 ID 초기화


      console.log("🔁 Returning to:", getReturnURL());

      // 🎯 퀄트릭스로 다시 이동
      window.location.href = getReturnURL();

    } catch (error) {
      console.error("🔥 데이터를 저장하는 데 문제가 발생했습니다:", error.message);
      alert(`🔥 데이터를 저장하는 데 문제가 발생했습니다: ${error.message}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          
      {/* 사용자가 글 작성하는 영역 */}
      <div style={{ width: "80%", textAlign: "left", marginBottom: "5px", fontSize: "18px" }}> 
        <h1>📝 짧은 글 짓기</h1>
        <p>아래 프롬프트에 한글로 이야기를 작성해주세요. (100-150 단어) </p>
        <p> 다음 제시어를 포함해야 합니다: </p>
        <p style={{ color: "red", fontWeight: "bold", fontSize: "22px", marginTop: "5px"}}>{requiredWords.join(", ")}</p>
        <p className="mt-2">단어 수: {wordCount}</p>

        <textarea
          style={{ width: "100%", height: "200px", padding: "10px", border: "1px solid #ccc", fontSize: "16px" }}
          value={isPreTextTyping ? preTextTyping + originalText : text}
          onChange={(e) => handleChange(e)}
          placeholder="여기에 글을 작성해주세요..."
          disabled={isInputDisabled} // ✅ 비활성화 반영
        />

        {showInputLockMessage && (
          <p style={{ color: "gray", fontWeight: "bold", fontSize: "14px", marginTop: "5px" }}>
            ✨ DraftMind가 입력중입니다. 잠시만 기다려주세요...
          </p>
        )}
      </div>

      {/* ✨ Prolific ID 입력 필드 추가 */}
      <div style={{ width: "80%", textAlign: "left", marginBottom: "10px"}}>
        <label style={{ fontWeight: "bold", marginRight: "10px" }}>EMBRAIN ID:</label>
        <input
          type="text"
          value={prolificId}
          onChange={(e) => setProlificId(e.target.value)}
          placeholder="Enter your ID"
          style={{ padding: "5px", fontSize: "14px", width: "200px", marginRight: "15px"}}
        />

        <span style={{ fontSize: "16px", color: "gray" }}>
          참여 확인을 위해 엠브레인 ID를 입력해주세요.
        </span>
      </div>


      {/* AI DraftMind의 출력이 나타나는 영역 */}
      <div 
        style={{ 
          width: "78.5%",
          marginLeft: "21px", 
          padding: "20px",
          border: "1px solid #ccc",
          backgroundColor: "#f9f9f9",
          textAlign: "left",
          overflow: "visible", // 출력내용이 많아지면 자동으로 출력창 크기 조절
          wordBreak: "break-word", // 긴 단어가 출력창을 넘어가면 줄바꿈
          whiteSpace: "pre-wrap", // \n을 줄바꿈으로 인식
          display: "flex",
          flexDirection: "column", // 제목, 설명, 본문을 세로 정렬
          alignItems: "center",
        }}>

        {/* 제목 */}
        <h2 style={{ marginTop: "3px", textAlign: "center", fontSize: "30px" }}> 
          <em>AI DraftMind</em>🪶
        </h2>
       
        {/* 설명 */}
        <p style={{marginTop: "0px", marginBottom: "30px", fontSize: "16px", textAlign: "center", color: "gray" }}>
          DraftMind 는 당신이 작성한 글을 읽고, 당신의 글을 개선하는 데 도움을 주는 조언을 제공합니다.
        </p>

        {/* 본문 및 이미지 컨테이너 (병렬 배치) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            marginTop: "10px",
          }}
        >

        {/* AI 아이콘 (왼쪽) */}
        <img
          src="/images/DraftMind_image.png"
          alt="AI Icon"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%", // 원형 이미지
            marginRight: "15px", // 이미지와 본문 사이 간격
            objectFit: "cover",
          }}
        />

        {/* 본문 (오른쪽) */}
        <div style={{ flex:1 }}>
          {hasTriggeredOnce && displayText.trim() !== "" &&  (
            <>
              {displayText
                .replaceAll(", ", ",\u00A0") // 쉼표 뒤 공백을 불간섭 공백으로 대체하여 줄바꿈 방지
                .split("\n")
                .map((line, index) => (
                  <p key={index} style={{ fontWeight: "bold", fontSize: "18px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {line}
                  </p>
                ))}

              {/* ✨ 예시 선택지 추가 블록 (프롬프트 출력 아래에 붙이기) */}
              {showExampleChoice && (
                <div style={{ marginTop: "20px", backgroundColor: "#fff", padding: "15px", border: "1px dashed #aaa", borderRadius: "6px" }}>
                  <p style={{ fontWeight: "bold" }}>다음 중 당신의 글에 넣을 문장을 한가지 선택해주세요:</p>

                  {[predefinedText1, predefinedText2, predefinedText3, predefinedText4, predefinedText5, predefinedText6].map((text, idx) => (
                    <p key={idx}><strong>{idx + 1}.</strong> {text}</p>
                  ))}

                  <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {[1, 2, 3, 4, 5, 6].map((index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleChoice(index)}
                        style={{ padding: "8px 16px" }}
                      >
                        예시 {index}번 선택
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
      {/* 경고 메시지 출력 */}
      {warning.length > 0 && (
          <div style={{ color: "red", fontWeight: "bold", fontSize: "16px", marginTop: "10px" }}>
            {warning.map((msg, index) => (
              <p key={index} style={{ margin: "5px 0" }}>❌ {msg}</p>
            ))}
          </div>
        )}

      <span style={{ marginTop: "10px", fontSize: "18px", color: "gray" }}>
      🔔글을 제출한 후, 2-3초 뒤 설문 페이지로 넘어갑니다. 이어지는 설문을 반드시 완료해주세요.
      </span>

      {/* Submit 버튼 - 가장 아래로 배치 */}
      <button 
        onClick={handleSubmit} 
        style={{ 
          marginTop: "10px", padding: "12px 25px", backgroundColor: "#007bff", 
          color: "white", border: "none", cursor: "pointer", fontSize: "20px", fontWeight: "bold"
        }}>
        제출하기
      </button>

      {showSurveyModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            width: "600px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <p>아래 문항에 동의하는 정도를 응답해주시기 바랍니다(1 =  전혀 그렇지 않다 ~ 7 = 매우 그렇다).</p>

            {[
              "나만의 것을 만들어낸 것 같은 느낌이 들었다.",
              "내가 이 과제를 수행한 것에 대해 모든 공로를 받을 자격이 있다고 느꼈다.",
              '스스로 "내가 해냈어!"라고 생각했다.',
              "최종 결과물에 대한 소유감을 느꼈다."
            ].map((question, qIndex) => (
              <div key={qIndex} style={{ marginTop: "30px" }}>
                <p style={{ marginBottom: "10px", fontWeight: "bold" }}>{question}</p>
                
                {/* 숫자 + 라벨 줄 */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((val, idx) => (
                    <div key={val} style={{ flex: 1, textAlign: "center", fontSize: "12px", fontWeight: "bold", lineHeight: "1.4" }}>
                      <div>{idx === 0 ? "전혀 그렇지 않다" : idx === 6 ? "매우 그렇다" : "\u00A0"}</div>
                      <div>{val}</div>
                    </div>
                  ))}
                </div>
                
                {/* 라디오 동그라미 줄 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                    <label key={val} style={{ textAlign: "center", flex: 1 }}>
                      <input
                        type="radio"
                        name={`q${qIndex}`}
                        value={val}
                        checked={surveyAnswers[qIndex] === val}
                        onChange={() => {
                          const newAnswers = [...surveyAnswers];
                          newAnswers[qIndex] = val;
                          setSurveyAnswers(newAnswers);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              disabled={surveyAnswers.includes(null)}
              onClick={() => {
                setShowSurveyModal(false);
                setSurveyCompleted(true);
                setHasTriggeredOnce(true);
              }}
              style={{
                marginTop: "30px",
                padding: "10px 20px",
                backgroundColor: surveyAnswers.includes(null) ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                cursor: surveyAnswers.includes(null) ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}
          >
              글쓰기 계속하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}