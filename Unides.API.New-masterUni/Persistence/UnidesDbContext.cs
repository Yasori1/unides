using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using Unides.Domain.Entities;

namespace Unides.Persistence
{
    public class UnidesDbContext : DbContext
    {
        public UnidesDbContext(DbContextOptions<UnidesDbContext> options) : base(options) { }

        // --- MEVCUT DB SETLER (Arkadaşlarınınki + Seninkiler) ---
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Community> Communities { get; set; }
        public DbSet<UserCommunity> UserCommunities { get; set; }
        public DbSet<About> Abouts { get; set; }
        public DbSet<Forkod> Forkod { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Event> Events { get; set; } // Genel Etkinlikler
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        // --- SENİN EKLEDİĞİN YENİ DB SETLER ---
        public DbSet<CommunityProject> CommunityProjects { get; set; }
        public DbSet<CommunityEvent> CommunityEvents { get; set; } // Topluluk Özel Etkinlikleri
        public DbSet<EventParticipant> EventParticipants { get; set; }

        // --- MENTÖRLÜK MODÜLÜ DB SETLER ---
        public DbSet<City> Cities { get; set; }
        public DbSet<Mentor> Mentors { get; set; }
        public DbSet<MentorApplication> MentorApplications { get; set; }
        public DbSet<CommunityMentorRequest> CommunityMentorRequests { get; set; }
        public DbSet<CommunityMentorAssignment> CommunityMentorAssignments { get; set; }
        public DbSet<ErrorLog> ErrorLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            // Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).HasColumnName("passwordhash").IsRequired().HasMaxLength(100);
                entity.Property(e => e.RoleId).HasColumnName("roleid");
                entity.Property(e => e.CreatedAt).HasColumnName("createdat");
                entity.Property(e => e.Rozet).HasColumnName("rozet");
                entity.Property(e => e.IsActive).HasColumnName("isactive");
                
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasOne(u => u.Role).WithMany(r => r.Users).HasForeignKey(u => u.RoleId).OnDelete(DeleteBehavior.Restrict);
            });

            // Roles
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
            });

            // Sessions
            modelBuilder.Entity<Session>(entity =>
            {
                entity.ToTable("Sessions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("iserid"); // DB'deki isme sadık kalındı
                entity.Property(e => e.RefreshTokenHash).HasColumnName("refreshtokenhash");
                entity.Property(e => e.CreatedAt).HasColumnName("createdat");
                entity.Property(e => e.ExpiresAt).HasColumnName("expiresat");
                entity.Property(e => e.RevokedAt).HasColumnName("revokedat");
                entity.Property(e => e.ReplacedByTokenHash).HasColumnName("replacedbytokenhash");
            });

            // Forkod
            modelBuilder.Entity<Forkod>(entity =>
            {
                entity.ToTable("forkod");
                entity.HasKey(e => e.OgrenciNo);
                entity.Property(e => e.OgrenciNo).HasColumnName("ogrencino");
                entity.Property(e => e.Ad).HasColumnName("ad").IsRequired().HasMaxLength(50);
                entity.Property(e => e.Soyad).HasColumnName("soyad").IsRequired().HasMaxLength(50);
                entity.Property(e => e.BolumAdi).HasColumnName("bolumadi").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Sinif).HasColumnName("sinif").IsRequired();
                entity.Property(e => e.Gpa).HasColumnName("gpa").HasColumnType("numeric(3,2)");
            });

            // Announcements
            modelBuilder.Entity<Announcement>(entity =>
            {
                entity.ToTable("Announcement");
                entity.HasKey(e => e.AnnId);
                entity.Property(e => e.AnnId).HasColumnName("Annid");
                entity.Property(e => e.Title).HasColumnName("Title").IsRequired().HasMaxLength(250);
                entity.Property(e => e.ShortDescription).HasColumnName("ShortDescription");
                entity.Property(e => e.AnnDate).HasColumnName("AnnDate")
                    .HasConversion(v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null);
                entity.Property(e => e.Description).HasColumnName("Description");
                entity.Property(e => e.Link).HasColumnName("Link");
                entity.Property(e => e.ImagePath).HasColumnName("ImagePath");
                entity.Property(e => e.CreatedAt).HasColumnName("Createdat").HasConversion(v => DateTime.SpecifyKind(v, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
                entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").HasConversion(v => DateTime.SpecifyKind(v, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
                entity.Property(e => e.AnnCreatedAtUserId).HasColumnName("AnnCreatedAtUserId");
                entity.Property(e => e.AnnUpdatedAtUserId).HasColumnName("AnnUpdatedAtUserId");
            });

            // ErrorLog
            modelBuilder.Entity<ErrorLog>(entity =>
            {
                entity.ToTable("error_log");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.OccurredAt).HasColumnName("occurred_at");
                entity.Property(e => e.Action).HasColumnName("action").IsRequired();
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.EntityType).HasColumnName("entity_type");
                entity.Property(e => e.EntityId).HasColumnName("entity_id");
                entity.Property(e => e.ErrorMessage).HasColumnName("error_message").IsRequired();
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasColumnType("text");
                entity.Property(e => e.UserAgent).HasColumnName("user_agent");
                entity.Property(e => e.CorrelationId).HasColumnName("correlation_id");
            });

            // Events (Genel)
            modelBuilder.Entity<Event>(entity =>
            {
                entity.ToTable("events");
                entity.HasKey(e => e.EtkinlikId);
                entity.Property(e => e.EtkinlikId).HasColumnName("etkinlikid");
                entity.Property(e => e.EtkinlikAdi).HasColumnName("etkinlikadi").HasMaxLength(255).IsRequired();
                entity.Property(e => e.ResimUrl).HasColumnName("resimurl");
                entity.Property(e => e.KisaAciklama).HasColumnName("kisaaciklama").HasMaxLength(500);
                entity.Property(e => e.DetayliAciklama).HasColumnName("detayliaciklama");
                entity.Property(e => e.BaslangicTarihi).HasColumnName("baslangictarihi").HasConversion(v => DateTime.SpecifyKind(v, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
                entity.Property(e => e.BitisTarihi).HasColumnName("bitistarihi").HasConversion(v => DateTime.SpecifyKind(v, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
                entity.Property(e => e.Konum).HasColumnName("konum").HasMaxLength(255);
                entity.Property(e => e.ToplulukId).HasColumnName("toplulukid");
                entity.HasOne<Community>().WithMany().HasForeignKey(e => e.ToplulukId).OnDelete(DeleteBehavior.Cascade);
            });

            // =========================================================
            // =========================================================

            // Communities (Küçük harf uyumlu + Yeni sütunlar)
            modelBuilder.Entity<Community>(entity =>
            {
                entity.ToTable("communities");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.About).HasColumnName("about");
                entity.Property(e => e.City).HasColumnName("city");
                entity.Property(e => e.University).HasColumnName("university");
                entity.Property(e => e.LogoUrl).HasColumnName("logourl");
                entity.Property(e => e.ToplulukBaskani).HasColumnName("toplulukbaskani");
                entity.Property(e => e.ContactEmail).HasColumnName("contactemail");
                entity.Property(e => e.WebsiteUrl).HasColumnName("websiteurl");
                entity.Property(e => e.SocialLinks).HasColumnName("sociallinks");
                entity.Property(e => e.CreatedAt).HasColumnName("createdat");
                entity.Property(e => e.Tags).HasColumnName("tags").HasColumnType("text[]").HasConversion(v => v != null ? v.ToArray() : null, v => v != null ? v.ToList() : new List<string>());
            });

            // UserCommunities (İlişkiler ve küçük harf)
            modelBuilder.Entity<UserCommunity>(entity =>
            {
                entity.ToTable("usercommunities");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("userid");
                entity.Property(e => e.CommunityId).HasColumnName("communityid");
                entity.Property(e => e.RoleInCommunity).HasColumnName("roleincommunity");
                entity.Property(e => e.JoinedAt).HasColumnName("joinedat");
                
                entity.HasOne(uc => uc.User).WithMany().HasForeignKey(uc => uc.UserId);
                entity.HasOne(uc => uc.Community).WithMany(c => c.UserCommunities).HasForeignKey(uc => uc.CommunityId);
            });

            // CommunityProjects
            modelBuilder.Entity<CommunityProject>(entity =>
            {
                entity.ToTable("communityprojects");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.CommunityId).HasColumnName("communityid");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.StartDate).HasColumnName("startdate");
                entity.Property(e => e.EndDate).HasColumnName("enddate");
                entity.Property(e => e.CreatedAt).HasColumnName("createdat");

                entity.HasOne(p => p.Community).WithMany(c => c.Projects).HasForeignKey(p => p.CommunityId).OnDelete(DeleteBehavior.Cascade);
            });

            // CommunityEvents (Topluluğa Özel Etkinlikler)
            modelBuilder.Entity<CommunityEvent>(entity =>
            {
                entity.ToTable("communityevents");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.CommunityId).HasColumnName("communityid");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.Summary).HasColumnName("summary");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.StartAt).HasColumnName("startat");
                entity.Property(e => e.EndAt).HasColumnName("endat");
                entity.Property(e => e.Location).HasColumnName("location");
                entity.Property(e => e.IsPublished).HasColumnName("ispublished");
                entity.Property(e => e.CreatedAt).HasColumnName("createdat");
                entity.Property(e => e.Tags).HasColumnName("tags").HasColumnType("text[]").HasConversion(v => v != null ? v.ToArray() : null, v => v != null ? v.ToList() : new List<string>());

                entity.HasOne(e => e.Community).WithMany(c => c.Events).HasForeignKey(e => e.CommunityId).OnDelete(DeleteBehavior.Cascade);
            });

            // EventParticipants (Katılımcı Tablosu)
            modelBuilder.Entity<EventParticipant>(entity =>
            {
                entity.ToTable("eventparticipants");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.EventId).HasColumnName("eventid");
                entity.Property(e => e.UserId).HasColumnName("userid");
                entity.Property(e => e.JoinedAt).HasColumnName("joinedat");
            });

            // =========================================================
            // MENTÖRLÜK MODÜLÜ TABLOLARI
            // =========================================================

            // Cities (İller)
            modelBuilder.Entity<City>(entity =>
            {
                entity.ToTable("cities");
                entity.HasKey(e => e.CitiesId);
                entity.Property(e => e.CitiesId).HasColumnName("cities_id");
                entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(20);
            });

            // Mentors (Mentör Başvuruları)
            modelBuilder.Entity<Mentor>(entity =>
            {
                entity.ToTable("mentors");
                entity.HasKey(e => e.MentorId);
                entity.Property(e => e.MentorId).HasColumnName("mentor_id");
                entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
                entity.Property(e => e.FullName).HasColumnName("full_name").IsRequired().HasMaxLength(150);
                entity.Property(e => e.PreferredCity).HasColumnName("preferred_city").IsRequired();
                entity.Property(e => e.ExpertiseAreas).HasColumnName("expertise_areas").HasColumnType("text").IsRequired()
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                        v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    );
                entity.Property(e => e.Experience).HasColumnName("experience");
                entity.Property(e => e.ContactEmail).HasColumnName("contact_email").HasMaxLength(150);
                entity.Property(e => e.ContactPhone).HasColumnName("contact_phone").HasMaxLength(50);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(30).HasDefaultValue("pending");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasConversion(
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    );

                entity.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(m => m.City).WithMany().HasForeignKey(m => m.PreferredCity).OnDelete(DeleteBehavior.Restrict);
            });

            // MentorApplications (Admin Kararları)
            modelBuilder.Entity<MentorApplication>(entity =>
            {
                entity.ToTable("mentor_applications");
                entity.HasKey(e => e.ApplicationId);
                entity.Property(e => e.ApplicationId).HasColumnName("application_id");
                entity.Property(e => e.MentorId).HasColumnName("mentor_id").IsRequired();
                entity.Property(e => e.AdminId).HasColumnName("admin_id");
                entity.Property(e => e.Decision).HasColumnName("decision").IsRequired().HasMaxLength(20);
                entity.Property(e => e.DecisionNote).HasColumnName("decision_note");
                entity.Property(e => e.DecidedAt).HasColumnName("decided_at").HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasConversion(
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    );

                entity.HasOne(a => a.Mentor).WithMany(m => m.Applications).HasForeignKey(a => a.MentorId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(a => a.Admin).WithMany().HasForeignKey(a => a.AdminId).OnDelete(DeleteBehavior.SetNull);
            });

            // CommunityMentorRequests (Topluluk Başkanı -> Mentör Başvuruları)
            modelBuilder.Entity<CommunityMentorRequest>(entity =>
            {
                entity.ToTable("community_mentor_requests");
                entity.HasKey(e => e.RequestId);
                entity.Property(e => e.RequestId).HasColumnName("request_id");
                entity.Property(e => e.CommunityId).HasColumnName("community_id").IsRequired();
                entity.Property(e => e.MentorId).HasColumnName("mentor_id").IsRequired();
                entity.Property(e => e.PresidentUserId).HasColumnName("president_user_id").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(30).HasDefaultValue("pending");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasConversion(
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    );
                entity.Property(e => e.DecidedAt).HasColumnName("decided_at")
                    .HasConversion(
                        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null,
                        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null
                    );

                entity.HasOne(r => r.Community).WithMany().HasForeignKey(r => r.CommunityId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(r => r.Mentor).WithMany(m => m.MentorRequests).HasForeignKey(r => r.MentorId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(r => r.President).WithMany().HasForeignKey(r => r.PresidentUserId).OnDelete(DeleteBehavior.Restrict);
            });

            // CommunityMentorAssignments (Mentör Atamaları)
            modelBuilder.Entity<CommunityMentorAssignment>(entity =>
            {
                entity.ToTable("community_mentor_assignments");
                entity.HasKey(e => e.AssignmentId);
                entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
                entity.Property(e => e.CommunityId).HasColumnName("community_id").IsRequired();
                entity.Property(e => e.MentorId).HasColumnName("mentor_id").IsRequired();
                entity.Property(e => e.StartDate).HasColumnName("start_date").HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .HasConversion(
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    );
                entity.Property(e => e.EndDate).HasColumnName("end_date")
                    .HasConversion(
                        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null,
                        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null
                    );

                entity.HasOne(a => a.Community).WithMany().HasForeignKey(a => a.CommunityId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(a => a.Mentor).WithMany(m => m.Assignments).HasForeignKey(a => a.MentorId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}