using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class AuthServiceTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<IAuditoriaService> _auditoriaMock;
        private readonly IConfiguration _configuration;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            var userStore = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var roleStore = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStore.Object, null!, null!, null!, null!);

            _auditoriaMock = new Mock<IAuditoriaService>();

            var inMemorySettings = new Dictionary<string, string?>
            {
                { "Jwt:Key", "SuperSecretKeyForTestingUDITInventorySystem12345!" },
                { "Jwt:Issuer", "UDIT_API" },
                { "Jwt:Audience", "UDIT_FE" },
                { "Jwt:ExpireMinutes", "60" }
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            _service = new AuthService(
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _configuration,
                _auditoriaMock.Object);
        }

        [Fact]
        public async Task LoginAsync_ShouldSucceed_WhenCredentialsAreValid()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "u-1",
                UserName = "admin",
                Email = "admin@udit.edu.co",
                NombreCompleto = "Administrador Sistema",
                Activo = true
            };

            _userManagerMock.Setup(m => m.FindByNameAsync("admin")).ReturnsAsync(user);
            _userManagerMock.Setup(m => m.CheckPasswordAsync(user, "Password123!")).ReturnsAsync(true);
            _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Admin" });

            var role = new IdentityRole("Admin");
            _roleManagerMock.Setup(m => m.FindByNameAsync("Admin")).ReturnsAsync(role);
            _roleManagerMock.Setup(m => m.GetClaimsAsync(role)).ReturnsAsync(new List<Claim>
            {
                new Claim("permission", "insumos.read"),
                new Claim("permission", "insumos.write")
            });

            var req = new LoginRequestDto { Username = "admin", Password = "Password123!" };

            // Act
            var result = await _service.LoginAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.NotEmpty(result.Data.Token);
            Assert.Equal("admin", result.Data.Username);
            Assert.Equal("Admin", result.Data.Role);
            Assert.Contains("insumos.read", result.Data.Permissions);
            Assert.Contains("insumos.write", result.Data.Permissions);
        }

        [Fact]
        public async Task LoginAsync_ShouldFail_WhenUserNotFound()
        {
            // Arrange
            _userManagerMock.Setup(m => m.FindByNameAsync("inexistente")).ReturnsAsync((ApplicationUser?)null);

            var req = new LoginRequestDto { Username = "inexistente", Password = "password" };

            // Act
            var result = await _service.LoginAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Usuario o contraseña incorrectos", result.Message);
        }

        [Fact]
        public async Task LoginAsync_ShouldFail_WhenAccountIsInactive()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "u-2",
                UserName = "desactivado",
                Activo = false
            };

            _userManagerMock.Setup(m => m.FindByNameAsync("desactivado")).ReturnsAsync(user);

            var req = new LoginRequestDto { Username = "desactivado", Password = "password" };

            // Act
            var result = await _service.LoginAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("cuenta está desactivada", result.Message);
        }

        [Fact]
        public async Task LoginAsync_ShouldFail_WhenPasswordIsIncorrect()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "u-3",
                UserName = "usuario",
                Activo = true
            };

            _userManagerMock.Setup(m => m.FindByNameAsync("usuario")).ReturnsAsync(user);
            _userManagerMock.Setup(m => m.CheckPasswordAsync(user, "wrong-pass")).ReturnsAsync(false);

            var req = new LoginRequestDto { Username = "usuario", Password = "wrong-pass" };

            // Act
            var result = await _service.LoginAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Usuario o contraseña incorrectos", result.Message);
        }

        [Fact]
        public async Task RegisterAsync_ShouldFail_WhenUsernameAlreadyExists()
        {
            // Arrange
            var existingUser = new ApplicationUser { UserName = "existente" };
            _userManagerMock.Setup(m => m.FindByNameAsync("existente")).ReturnsAsync(existingUser);

            var req = new RegisterRequestDto
            {
                Username = "existente",
                Email = "nuevo@udit.edu.co",
                Password = "Password123!",
                NombreCompleto = "Usuario Nuevo"
            };

            // Act
            var result = await _service.RegisterAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("nombre de usuario ya existe", result.Message);
        }

        [Fact]
        public async Task RegisterAsync_ShouldFail_WhenEmailAlreadyExists()
        {
            // Arrange
            _userManagerMock.Setup(m => m.FindByNameAsync("nuevo")).ReturnsAsync((ApplicationUser?)null);
            _userManagerMock.Setup(m => m.FindByEmailAsync("repetido@udit.edu.co")).ReturnsAsync(new ApplicationUser());

            var req = new RegisterRequestDto
            {
                Username = "nuevo",
                Email = "repetido@udit.edu.co",
                Password = "Password123!",
                NombreCompleto = "Usuario Nuevo"
            };

            // Act
            var result = await _service.RegisterAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("correo electrónico ya está registrado", result.Message);
        }

        [Fact]
        public async Task RegisterAsync_ShouldFail_WhenRoleDoesNotExist()
        {
            // Arrange
            _userManagerMock.Setup(m => m.FindByNameAsync("nuevo")).ReturnsAsync((ApplicationUser?)null);
            _userManagerMock.Setup(m => m.FindByEmailAsync("nuevo@udit.edu.co")).ReturnsAsync((ApplicationUser?)null);
            _roleManagerMock.Setup(m => m.RoleExistsAsync("SuperRoleInexistente")).ReturnsAsync(false);

            var req = new RegisterRequestDto
            {
                Username = "nuevo",
                Email = "nuevo@udit.edu.co",
                Password = "Password123!",
                NombreCompleto = "Usuario Nuevo",
                Role = "SuperRoleInexistente"
            };

            // Act
            var result = await _service.RegisterAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("no existe", result.Message);
        }

        [Fact]
        public async Task RegisterAsync_ShouldSucceed_AndLogAuditoria()
        {
            // Arrange
            _userManagerMock.Setup(m => m.FindByNameAsync("practicante1")).ReturnsAsync((ApplicationUser?)null);
            _userManagerMock.Setup(m => m.FindByEmailAsync("practicante1@udit.edu.co")).ReturnsAsync((ApplicationUser?)null);
            _roleManagerMock.Setup(m => m.RoleExistsAsync("Assistant")).ReturnsAsync(true);
            _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), "F123456.")).ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Assistant")).ReturnsAsync(IdentityResult.Success);

            var req = new RegisterRequestDto
            {
                Username = "practicante1",
                Email = "practicante1@udit.edu.co",
                Password = "F123456.",
                NombreCompleto = "Practicante Uno",
                Role = "Assistant"
            };

            // Act
            var result = await _service.RegisterAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("practicante1", result.Data.Username);
            Assert.Equal("Assistant", result.Data.Role);
            _auditoriaMock.Verify(a => a.LogAsync("CREAR", "Usuario", It.Is<string>(s => s.Contains("practicante1")), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ChangePasswordAsync_ShouldFail_WhenCurrentPasswordIncorrect()
        {
            // Arrange
            var user = new ApplicationUser { Id = "u-10", UserName = "admin" };
            _userManagerMock.Setup(m => m.FindByIdAsync("u-10")).ReturnsAsync(user);
            _userManagerMock.Setup(m => m.ChangePasswordAsync(user, "wrong-pass", "new-pass!"))
                            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "PasswordMismatch", Description = "Incorrect password" }));

            var req = new ChangePasswordRequestDto
            {
                CurrentPassword = "wrong-pass",
                NewPassword = "new-pass!"
            };

            // Act
            var result = await _service.ChangePasswordAsync("u-10", req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("incorrecta", result.Message);
        }

        [Fact]
        public async Task ChangePasswordAsync_ShouldSucceed_AndClearDebeCambiarPassword()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "u-10",
                UserName = "admin",
                DebeCambiarPassword = true
            };

            _userManagerMock.Setup(m => m.FindByIdAsync("u-10")).ReturnsAsync(user);
            _userManagerMock.Setup(m => m.ChangePasswordAsync(user, "OldPassword1!", "NewPassword2!"))
                            .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

            var req = new ChangePasswordRequestDto
            {
                CurrentPassword = "OldPassword1!",
                NewPassword = "NewPassword2!"
            };

            // Act
            var result = await _service.ChangePasswordAsync("u-10", req);

            // Assert
            Assert.True(result.Success);
            Assert.False(user.DebeCambiarPassword);
            _userManagerMock.Verify(m => m.UpdateAsync(user), Times.Once);
            _auditoriaMock.Verify(a => a.LogAsync("EDITAR", "Usuario", It.Is<string>(s => s.Contains("cambió su contraseña")), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldFail_WhenUsernameAlreadyTakenByOtherUser()
        {
            // Arrange
            var user = new ApplicationUser { Id = "u-1", UserName = "original" };
            var otherUser = new ApplicationUser { Id = "u-2", UserName = "otro_user" };

            _userManagerMock.Setup(m => m.FindByIdAsync("u-1")).ReturnsAsync(user);
            _userManagerMock.Setup(m => m.FindByNameAsync("otro_user")).ReturnsAsync(otherUser);

            var req = new UpdateProfileRequestDto
            {
                Username = "otro_user",
                NombreCompleto = "Nuevo Nombre"
            };

            // Act
            var result = await _service.UpdateProfileAsync("u-1", req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("nombre de usuario ya está en uso", result.Message);
        }

        [Fact]
        public async Task GetUserInfoAsync_ShouldReturnCompleteUserData()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = "u-100",
                UserName = "developer",
                Email = "dev@udit.edu.co",
                NombreCompleto = "Lead Developer",
                Activo = true
            };

            _userManagerMock.Setup(m => m.FindByIdAsync("u-100")).ReturnsAsync(user);
            _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Developer" });

            // Act
            var result = await _service.GetUserInfoAsync("u-100");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("developer", result.Data.Username);
            Assert.Equal("Developer", result.Data.Role);
            Assert.Equal("Lead Developer", result.Data.NombreCompleto);
        }
    }
}
