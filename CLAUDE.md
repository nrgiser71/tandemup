# Claude Instructies voor TandemUp Project

## Git Workflow
1. **Na aanpassingen altijd commit en push doen**
   - Elke keer dat code wordt aangepast, commit en push naar de repository
   - Gebruik beschrijvende commit messages die de wijzigingen uitleggen
   - Include altijd de Claude Code footer in commits

## Subagent Gebruik
2. **Gebruik altijd subagents als die je kunnen helpen**
   - **Debuggen**: Gebruik `tickedify-bug-hunter` voor bug fixes en troubleshooting
   - **Nieuwe features**: Gebruik `tickedify-feature-builder` voor nieuwe functionaliteit
   - **Testen**: Gebruik `tickedify-testing` voor Playwright tests en browser automation
   - **UI Design**: Gebruik `ui-designer` voor interface improvements
   - **Database aanpassingen**: Gebruik `database-administrator` voor database changes
   - **API development**: Gebruik `api-designer` voor API-related work
   - **Backend development**: Gebruik `backend-developer` voor server-side changes
   - **Frontend development**: Gebruik `nextjs-developer` voor Next.js specific work

## Project Context
- Dit is een TandemUp applicatie voor virtual coworking sessions
- Gebruikt Next.js 14+ met App Router
- Database: PostgreSQL via Supabase
- UI: DaisyUI + Tailwind CSS
- Testing: Playwright voor end-to-end tests
- Methodologie: "Baas Over Je Tijd" productivity approach

## Development Guidelines
- Volg bestaande code conventions en patterns
- Test altijd nieuwe features met Playwright waar mogelijk
- Commit regelmatig met duidelijke messages
- Gebruik subagents voor specialistische taken