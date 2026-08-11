using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IAuditoriaService _auditoriaService;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            IAuditoriaService auditoriaService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _auditoriaService = auditoriaService;
        }

        public async Task<OperationResult<LoginResponseDto>> LoginAsync(LoginRequestDto request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null)
                return OperationResult<LoginResponseDto>.Fail("Usuario o contraseña incorrectos");

            if (!user.Activo)
                return OperationResult<LoginResponseDto>.Fail("La cuenta está desactivada");

            var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
                return OperationResult<LoginResponseDto>.Fail("Usuario o contraseña incorrectos");

            var roles = await _userManager.GetRolesAsync(user);
            var token = await GenerateJwtToken(user, roles);

            return OperationResult<LoginResponseDto>.Ok(new LoginResponseDto
            {
                Token = token,
                Expiration = DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
                Username = user.UserName!,
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User"
            }, "Inicio de sesión exitoso");
        }

        public async Task<OperationResult<LoginResponseDto>> RegisterAsync(RegisterRequestDto request)
        {
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null)
                return OperationResult<LoginResponseDto>.Fail("El nombre de usuario ya existe");

            if (!await _roleManager.RoleExistsAsync(request.Role))
                return OperationResult<LoginResponseDto>.Fail($"El rol '{request.Role}' no existe");

            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Email,
                NombreCompleto = request.NombreCompleto,
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return OperationResult<LoginResponseDto>.Fail($"Error al crear usuario: {errors}");
            }

            await _userManager.AddToRoleAsync(user, request.Role);

            var roles = new List<string> { request.Role };
            var token = await GenerateJwtToken(user, roles);

            await _auditoriaService.LogAsync("CREAR", "Usuario", $"Se registró el nuevo usuario '{user.UserName}' con Rol '{request.Role}'");

            return OperationResult<LoginResponseDto>.Ok(new LoginResponseDto
            {
                Token = token,
                Expiration = DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
                Username = user.UserName!,
                NombreCompleto = user.NombreCompleto,
                Role = request.Role
            }, "Usuario registrado exitosamente");
        }

        public async Task<OperationResult<UserInfoDto>> GetUserInfoAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return OperationResult<UserInfoDto>.Fail("Usuario no encontrado");

            var roles = await _userManager.GetRolesAsync(user);

            return OperationResult<UserInfoDto>.Ok(new UserInfoDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email!,
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User",
                Activo = user.Activo,
                FechaCreacion = user.FechaCreacion
            });
        }

        private Task<string> GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.UserName!),
                new(ClaimTypes.Email, user.Email!),
                new("NombreCompleto", user.NombreCompleto)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
                signingCredentials: credentials
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        private int GetJwtExpireMinutes()
        {
            var config = _configuration["Jwt:ExpireMinutes"];
            return int.TryParse(config, out var minutes) ? minutes : 480;
        }
    }
}
