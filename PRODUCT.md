# Bas Gaza

## What it is

A simple, original phone game that helps people prepare for the Turkish driving licence theory exam (MEB e-sınav).

You drive a car along a road, seen from above (2D). Every so often something happens on the road: a crash, a junction, a warning light, a pedestrian. The game pauses and asks one exam question about that situation. Answer right and you drive on. Answer wrong and something goes wrong in the story. Too many mistakes and you do not get your licence.

It runs in the phone's web browser and is played with one finger. It is a short, "one more try" game, not a 3D driving simulator.

## Who it is for

- People in Turkey who are preparing for the driving licence e-sınav.
- Mostly young adults who find the usual question-bank apps boring.
- They play on their phone, in short breaks, a few minutes at a time.

All text in the game is in Turkish.

## The real exam (checked source)

The theory e-sınav has 50 questions in 45 minutes, in four courses. A candidate passes with 70 or more out of 100. Wrong answers do not cancel right ones, and every question has the same weight.

| Course (official name) | Questions |
|---|---|
| İlk Yardım | 12 |
| Trafik ve Çevre | 23 |
| Araç Tekniği | 9 |
| Trafik Adabı | 6 |
| **Total** | **50** |

Source: T.C. Millî Eğitim Bakanlığı, *Motorlu Taşıt Sürücü Kursiyerleri e-Sınav Uygulama Kılavuzu 2020*, Tablo-2 (page 4) and section 9 "Değerlendirme" (page 10). Copy found at https://hasbahceaihl.meb.k12.tr/meb_iys_dosyalar/34/13/758711/dosyalar/2020_02/03165823_28152051_2020_MTSK_e-SYnav_Uygulama_KYlavuzu.pdf (checked on 29 October 2026). This is the newest official guide we could open. Before release, check whether MEB has published a newer guide with different numbers.

## How one run plays

1. The start screen shows the name, a "Karma tur" button (mixed run), a button for each course ("Ya da bir bölüm çalış") and the best score.
2. The car drives forward on its own along one road. The player moves it between lanes with one finger (swipe or tap left/right) to avoid cones and slow cars. Hitting one slows you down and costs a little can (health, see Scoring).
3. An event appears ahead (for example, a crashed car at the side of the road). The car stops and a question card opens with the situation, the question and the answer options.
4. The player taps an answer.
   - Right: a short "Doğru!" with a one-line explanation, then the car drives on.
   - Wrong: a short scene shows the outcome (see below), then the correct answer with its explanation. This costs a lot of can.
5. A run has **2 events from each course that has questions**, in random order: 8 events with all four courses, 6 while Araç Tekniği is missing (see Version 1). The questions are picked at random from the content file, so each run is a little different.
   - **Course run** (added 1 November 2026): the player picks one course and gets up to 6 questions from that course only. Each course and the mixed run keep their own best score; the end screen has "Tekrar oyna" and "Ana menü".
6. At the end:
   - **Passed:** "Tebrikler, ehliyetini aldın!" with the score.
   - **Failed:** "Ehliyetini alamadın, tekrar dene!" with the score and a "Tekrar oyna" button.

One run should take about 2–3 minutes.

## The four events and their fail outcomes

The tone is light. Nobody dies in the game; outcomes are soft but clear.

| Course | What happens on the road | Example question topic | Wrong answer outcome (Turkish UI text) |
|---|---|---|---|
| İlk Yardım | A small crash at the roadside; someone is hurt. You stop to help. | What to do first at an accident scene | "Ambulans geç kaldı, yaralıya yardım edemedin." |
| Trafik ve Çevre | A junction, a traffic light, a sign or a speed limit. | Who has right of way, what the sign means | "Polis seni durdurdu, ceza yazdı." |
| Araç Tekniği | A warning light comes on, or smoke comes from the engine. | What the warning light means, what to check | "Araban yolda kaldı, çekici çağırdın." |
| Trafik Adabı | A pedestrian at a crossing, an ambulance behind you, a driver honking. | Courtesy and correct behaviour in traffic | "Sınav görevlisi seni arabadan indirdi." |

The exact wording above can still change during playtesting.

## Scoring and game over

- **Can bar** (chosen by Sude on 29 October 2026): you start with 100 can, shown as a bar at the top of the screen.
  - A wrong answer costs **50**. A hit on a cone or slow car costs **10**.
  - At 0 can the run ends at once with "Ehliyetini alamadın, tekrar dene!".
  - So 2 wrong answers always end the run. This keeps the real pass mark: with 6 questions, 5 right (83%) passes and 4 right (67%) fails.
    After many hits, even 1 wrong answer can be enough.
  - When Araç Tekniği returns and a run has 8 questions, the costs must be changed so that the 3rd wrong answer ends the run (for example 34 per wrong answer).
- If you reach the end of the run with some can left, you pass: "Tebrikler, ehliyetini aldın!".
- Score: 100 points per right answer, plus the can you have left at the end (so driving carefully counts).
- The best score is kept on the phone only (browser storage). No account.

## Content rules

These rules matter more than anything else in the project.

1. Every question, answer and explanation comes from one content file in the project (JSON or CSV). The game never generates or invents questions.
2. The content is based on official material (for example MEB course material and official regulations). Each question records its source.
3. **First aid content must be exactly right.** Wrong first aid advice can hurt someone in real life. If a source is unclear or sources disagree, the question is left out.
4. We do not copy copyrighted question banks word for word. Questions are written in our own words from the official facts.
5. Traffic signs, warning lights and all other pictures are drawn by us (SVG). We do not copy images from other apps or sites.
6. Each question is checked by Sude before it goes into the game.

## Version 1

- One road, one run of 2 events per course, and a run for a single course.
- A content file with at least 4 checked questions per course, so runs are not all the same.
- **Araç Tekniği is left out for now** (decided 29 October 2026): we found no openly available official MEB material for it. It comes back, with its tow-truck fail scene already built, once an official source is found.
- Lane switching with one finger, a few obstacles.
- A simple picture for each of the four event types, and a short scene for each fail outcome.
- Question card, right/wrong feedback with explanation, 3 mistakes = game over.
- Start screen, end screen, "Tekrar oyna", best score saved on the phone.
- Turkish text only.
- A static web app: it works by opening a web link on the phone. No server, no accounts, no AI model.

## Not in version 1

- More levels, cities or roads
- Daily streaks, daily challenges, rewards
- Accounts, login, online leaderboards
- A full 50-question "real exam" mode or a timer per question
- Statistics per course ("you are weak in Araç Tekniği")
- Sounds and music (maybe a simple vibration on a wrong answer)
- English or other languages
- Ads or payments
- An App Store / Google Play app (it stays a web app for now)
- Any AI model or server

## Build order

Small steps. Each step ends with something Sude can open and play on her own phone.

0. **Choose tools and hosting.** Decided on 29 October 2026:
   - Tools: plain HTML, CSS and JavaScript, drawing on a canvas. No framework, no library, no build step.
   - Steps 1–6: a small local web server on the Mac; Sude opens the link on her phone over the same home Wi-Fi. No account needed.
   - Step 7: publish on GitHub Pages (free) so friends can play. This needs a GitHub account.
1. **Empty game online.** A page with the name "Bas Gaza" and a "Başla" button opens on Sude's phone from a web link.
2. **Road and car.** The road scrolls, the car moves between lanes with one finger.
3. **Obstacles.** Cones and slow cars appear; hitting them slows you down.
4. **First question.** A content file with a few checked questions. One event appears, the game pauses and shows the question card; right/wrong feedback works.
5. **All events.** Each course has its own picture on the road and its own fail scene (done). 2 events per course in a run.
6. **Mistakes and the end.** 3 licence cards, game over on the 3rd mistake, pass/fail end screen, score, "Tekrar oyna", best score saved.
7. **Full content and playtest.** At least 16 checked questions. Sude and a few friends play it and say whether it is fun. We decide what comes next from that.
8. **Practise one course** (after the playtest, 1 November 2026). The real exam has 4 courses (12 İlk Yardım, 23 Trafik ve Çevre, 9 Araç Tekniği, 6 Trafik Adabı). Sude wants both mixed runs and runs for one course.
   - First: a course choice on the start screen (done).
   - Then: more checked questions, at least 15 per course, starting with Trafik ve Çevre (the biggest course). Sude reviews each batch. Done 1 November 2026: 16 İlk Yardım, 15 Trafik ve Çevre, 15 Trafik Adabı. The MEB first aid deck we use covers only general first aid (scene safety, checking the casualty, 112, recovery position); bleeding, burns, fractures and CPR need another official source.
   - Maybe later: make mixed runs follow the exam's share of questions per course.
